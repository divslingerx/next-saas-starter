import Papa from 'papaparse';
import * as fs from 'fs';
import { db } from '@tmcdm/db';
import { csvProcessingJobs, files, type ProcessingConfig } from '@tmcdm/db/src/schema/files';
import { eq, and } from 'drizzle-orm';
import { FileStorageService } from './storage';
import { hashBuffer } from '../utils/hash';

export interface ProcessingResult {
  data: any[][];
  rowCount: number;
  columnCount: number;
  preview: any[][];
  hash: string;
}

export class CSVProcessingService {
  constructor(private storage: FileStorageService) {}

  /**
   * Start a new processing job
   */
  async createJob(
    originalFileId: string,
    userId: string,
    config: ProcessingConfig
  ): Promise<typeof csvProcessingJobs.$inferSelect> {
    // Get original file
    const [originalFile] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, originalFileId), eq(files.userId, userId)))
      .limit(1);

    if (!originalFile) {
      throw new Error('Original file not found');
    }

    // Check for existing job with same config
    const configHash = hashBuffer(JSON.stringify(config));
    const [existingJob] = await db
      .select()
      .from(csvProcessingJobs)
      .where(
        and(
          eq(csvProcessingJobs.originalFileId, originalFileId),
          eq(csvProcessingJobs.status, 'completed')
        )
      )
      .limit(1);

    if (existingJob && existingJob.processingConfig) {
      const existingConfigHash = hashBuffer(JSON.stringify(existingJob.processingConfig));
      if (configHash === existingConfigHash) {
        return existingJob; // Return existing completed job
      }
    }

    // Read and parse original file
    const fileBuffer = await this.storage.readFile(originalFileId, userId);
    const originalData = await this.parseCSV(fileBuffer.toString());

    // Create preview - limit to 100 rows
    const originalPreview = originalData.slice(0, 100);

    // Create new job
    const result = await db
      .insert(csvProcessingJobs)
      .values({
        userId,
        originalFileId,
        originalHash: originalFile.hash,
        originalRowCount: originalData.length,
        originalColumnCount: originalData[0]?.length || 0,
        originalPreview,
        processingConfig: config,
        status: 'pending',
        processingProgress: 0,
      })
      .returning();

    const job = Array.isArray(result) ? result[0] : result;
    if (!job) {
      throw new Error('Failed to create processing job');
    }
    
    return job;
  }

  /**
   * Process a CSV file
   */
  async processJob(jobId: string): Promise<void> {
    // Get job
    const [job] = await db
      .select()
      .from(csvProcessingJobs)
      .where(eq(csvProcessingJobs.id, jobId))
      .limit(1);

    if (!job) {
      throw new Error('Job not found');
    }

    try {
      // Update status to processing
      await this.updateJobProgress(jobId, 'processing', 0);

      // Read original file
      const fileBuffer = await this.storage.readFile(job.originalFileId, job.userId);
      let data = await this.parseCSV(fileBuffer.toString());

      const config = job.processingConfig as ProcessingConfig;
      const totalSteps = this.countProcessingSteps(config) + 1; // +1 for empty column removal
      let currentStep = 0;

      // Always remove empty columns first
      data = await this.removeEmptyColumns(data);
      currentStep++;
      await this.updateJobProgress(jobId, 'processing', (currentStep / totalSteps) * 100);

      // Apply transformations
      if (config.removeDuplicates && config.duplicateCheckColumns) {
        data = await this.removeDuplicates(data, config.duplicateCheckColumns);
        currentStep++;
        await this.updateJobProgress(jobId, 'processing', (currentStep / totalSteps) * 100);
      }

      if (config.mergeColumns && config.mergeDelimiter) {
        data = await this.mergeColumns(data, config.mergeColumns, config.mergeDelimiter);
        currentStep++;
        await this.updateJobProgress(jobId, 'processing', (currentStep / totalSteps) * 100);
      }

      if (config.columnMappings) {
        data = await this.mapColumns(data, config.columnMappings);
        currentStep++;
        await this.updateJobProgress(jobId, 'processing', (currentStep / totalSteps) * 100);
      }

      // Convert data back to CSV
      const processedCsv = Papa.unparse(data);
      const processedBuffer = Buffer.from(processedCsv);

      // Store processed file
      const processedFile = await this.storage.storeProcessedFile(
        processedBuffer,
        job.originalFileId,
        job.userId,
        jobId
      );

      // Create preview - limit to 100 rows
      const processedPreview = data.slice(0, 100);

      // Update job with results
      await db
        .update(csvProcessingJobs)
        .set({
          status: 'completed',
          processingCompletedAt: new Date(),
          processedFileId: processedFile.id,
          processedHash: processedFile.hash,
          processedRowCount: data.length,
          processedColumnCount: data[0]?.length || 0,
          processedPreview,
          processingProgress: 100,
          updatedAt: new Date(),
        })
        .where(eq(csvProcessingJobs.id, jobId));

    } catch (error) {
      // Update job with error
      await db
        .update(csvProcessingJobs)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Processing failed',
          processingProgress: 0,
          updatedAt: new Date(),
        })
        .where(eq(csvProcessingJobs.id, jobId));

      throw error;
    }
  }

  /**
   * Update job progress
   */
  private async updateJobProgress(
    jobId: string,
    status: string,
    progress: number
  ): Promise<void> {
    await db
      .update(csvProcessingJobs)
      .set({
        status,
        processingProgress: Math.round(progress),
        processingStartedAt: status === 'processing' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(csvProcessingJobs.id, jobId));
  }

  /**
   * Parse CSV data
   */
  private async parseCSV(csvString: string): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        complete: (result) => {
          if (result.errors.length > 0) {
            console.warn('CSV parsing warnings:', result.errors);
          }
          resolve(result.data as any[][]);
        },
        error: reject,
        skipEmptyLines: true,
      });
    });
  }

  /**
   * Remove duplicate rows
   */
  private async removeDuplicates(
    data: any[][],
    checkColumns: string[]
  ): Promise<any[][]> {
    if (data.length === 0) return data;

    const headers = data[0];
    if (!headers) return data;
    
    const columnIndices = checkColumns
      .map(col => headers.indexOf(col))
      .filter(idx => idx !== -1);

    if (columnIndices.length === 0) return data;

    const seen = new Set<string>();
    const result: any[][] = [headers]; // Keep headers

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      const key = columnIndices.map(idx => row[idx] || '').join('|');
      
      if (!seen.has(key)) {
        seen.add(key);
        result.push(row);
      }
    }

    return result;
  }

  /**
   * Merge columns
   */
  private async mergeColumns(
    data: any[][],
    columnsToMerge: string[],
    delimiter: string
  ): Promise<any[][]> {
    if (data.length === 0) return data;

    const headers = data[0];
    if (!headers) return data;
    
    const columnIndices = columnsToMerge
      .map(col => headers.indexOf(col))
      .filter(idx => idx !== -1);

    if (columnIndices.length === 0) return data;

    // Create new headers
    const mergedColumnName = columnsToMerge.join('_');
    const newHeaders = [...headers, mergedColumnName];

    // Process rows
    const result: any[][] = [newHeaders];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      const mergedValue = columnIndices
        .map(idx => row[idx] || '')
        .filter(val => val !== '')
        .join(delimiter);
      
      result.push([...row, mergedValue]);
    }

    return result;
  }

  /**
   * Map columns (rename/reorder)
   */
  private async mapColumns(
    data: any[][],
    mappings: Record<string, string>
  ): Promise<any[][]> {
    if (data.length === 0) return data;

    const headers = data[0];
    if (!headers) return data;
    
    const newHeaders: string[] = [];
    const columnMapping: number[] = [];

    // Build new headers and mapping
    headers.forEach((header, index) => {
      const mappedName = mappings[header];
      if (mappedName && mappedName !== 'Do Not Import') {
        newHeaders.push(mappedName);
        columnMapping.push(index);
      }
    });

    if (newHeaders.length === 0) {
      throw new Error('No columns to import after mapping');
    }

    // Process rows
    const result: any[][] = [newHeaders];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      const newRow = columnMapping.map(idx => row[idx] || '');
      result.push(newRow);
    }

    return result;
  }

  /**
   * Remove empty columns (columns with headers but no data)
   */
  private async removeEmptyColumns(data: any[][]): Promise<any[][]> {
    if (data.length <= 1) return data; // No data rows to check

    const headers = data[0];
    if (!headers) return data;
    
    const dataRows = data.slice(1);
    
    // Find non-empty column indices
    const nonEmptyColumnIndices: number[] = [];
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      // Check if any data row has a non-empty value in this column
      const hasData = dataRows.some(row => 
        row[colIndex] !== undefined && 
        row[colIndex] !== null && 
        String(row[colIndex]).trim() !== ''
      );
      
      if (hasData) {
        nonEmptyColumnIndices.push(colIndex);
      }
    }

    // If all columns are empty, keep at least the headers
    if (nonEmptyColumnIndices.length === 0 && headers.length > 0) {
      return [headers];
    }

    // Filter headers and data rows
    const filteredHeaders = nonEmptyColumnIndices.map(i => headers[i]);
    const result: any[][] = [filteredHeaders];
    
    for (const row of dataRows) {
      const filteredRow = nonEmptyColumnIndices.map(i => row[i] || '');
      result.push(filteredRow);
    }

    return result;
  }

  /**
   * Get preview of CSV file (limited rows)
   */
  async getPreview(filePath: string, limit: number = 100): Promise<{ rows: any[][], totalRows: number, columns: string[] }> {
    return new Promise((resolve, reject) => {
      const rows: any[][] = [];
      let totalRows = 0;
      
      Papa.parse(fs.createReadStream(filePath), {
        complete: (results) => {
          const allData = results.data as any[][];
          
          // Remove empty columns from preview
          const processedData = this.removeEmptyColumnsSync(allData);
          const preview = processedData.slice(0, limit);
          const columns = preview[0] || [];
          
          resolve({
            rows: preview,
            totalRows: processedData.length,
            columns
          });
        },
        error: reject
      });
    });
  }

  /**
   * Synchronous version of removeEmptyColumns for preview
   */
  private removeEmptyColumnsSync(data: any[][]): any[][] {
    if (data.length <= 1) return data;

    const headers = data[0];
    if (!headers) return data;
    
    const dataRows = data.slice(1);
    
    // Find non-empty column indices
    const nonEmptyColumnIndices: number[] = [];
    
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      // Check if the column has actual data (not just empty strings)
      const hasData = dataRows.some(row => {
        // Make sure we're checking within the row's bounds
        if (!row || colIndex >= row.length) return false;
        const value = row[colIndex];
        return value !== undefined && 
               value !== null && 
               value !== '' &&
               String(value).trim() !== '';
      });
      
      if (hasData) {
        nonEmptyColumnIndices.push(colIndex);
      }
    }

    if (nonEmptyColumnIndices.length === 0 && headers.length > 0) {
      return [headers];
    }

    const filteredHeaders = nonEmptyColumnIndices.map(i => headers[i]);
    const result: any[][] = [filteredHeaders];
    
    for (const row of dataRows) {
      const filteredRow = nonEmptyColumnIndices.map(i => row[i] !== undefined ? row[i] : '');
      result.push(filteredRow);
    }

    return result;
  }

  /**
   * Count processing steps for progress calculation
   */
  private countProcessingSteps(config: ProcessingConfig): number {
    let steps = 1; // Always include empty column removal
    if (config.removeDuplicates) steps++;
    if (config.mergeColumns) steps++;
    if (config.columnMappings) steps++;
    return steps;
  }

  /**
   * Get job status with auth check
   */
  async getJobStatus(
    jobId: string,
    userId: string
  ): Promise<typeof csvProcessingJobs.$inferSelect | null> {
    const [job] = await db
      .select()
      .from(csvProcessingJobs)
      .where(and(eq(csvProcessingJobs.id, jobId), eq(csvProcessingJobs.userId, userId)))
      .limit(1);

    return job || null;
  }

  /**
   * Check for existing processed file by hash
   */
  async checkProcessedByHash(
    originalHash: string,
    config: ProcessingConfig,
    userId: string
  ): Promise<typeof csvProcessingJobs.$inferSelect | null> {
    const configHash = hashBuffer(JSON.stringify(config));
    
    const jobs = await db
      .select()
      .from(csvProcessingJobs)
      .where(
        and(
          eq(csvProcessingJobs.originalHash, originalHash),
          eq(csvProcessingJobs.userId, userId),
          eq(csvProcessingJobs.status, 'completed')
        )
      );

    // Find job with matching config
    for (const job of jobs) {
      if (job.processingConfig) {
        const jobConfigHash = hashBuffer(JSON.stringify(job.processingConfig));
        if (jobConfigHash === configHash) {
          return job;
        }
      }
    }

    return null;
  }
}