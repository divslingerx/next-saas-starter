import fs from 'fs/promises';
import path from 'path';
import { db } from '@tmcdm/db';
import { files, type NewFile } from '@tmcdm/db/src/schema/files';
import { eq, and } from 'drizzle-orm';
import { hashFile } from '../utils/hash';

export interface StorageConfig {
  basePath: string;
  maxFileSize?: number; // in bytes
  allowedMimeTypes?: string[];
}

export class FileStorageService {
  private basePath: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor(config: StorageConfig) {
    this.basePath = config.basePath || './storage';
    this.maxFileSize = config.maxFileSize || 50 * 1024 * 1024; // 50MB default
    this.allowedMimeTypes = config.allowedMimeTypes || [
      'text/csv',
      'application/vnd.ms-excel',
      'application/csv',
      'text/plain'
    ];
  }

  /**
   * Store a file to disk and create database record
   */
  async storeFile(
    fileBuffer: Buffer,
    fileName: string,
    userId: string,
    mimeType?: string,
    fileHash?: string
  ): Promise<typeof files.$inferSelect> {
    // Validate file size
    if (fileBuffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum of ${this.maxFileSize} bytes`);
    }

    // Validate mime type if provided
    if (mimeType && !this.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    // Create user directory structure
    const fileId = crypto.randomUUID();
    const userDir = path.join(this.basePath, userId);
    const fileDir = path.join(userDir, fileId);
    
    // Ensure base path exists first
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create base storage directory:', this.basePath, error);
      throw new Error(`Storage directory creation failed: ${error}`);
    }
    
    // Create file-specific directory
    try {
      await fs.mkdir(fileDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create file directory:', fileDir, error);
      throw new Error(`File directory creation failed: ${error}`);
    }

    // Save original file
    const ext = path.extname(fileName) || '.csv';
    const storagePath = path.join(userId, fileId, `original${ext}`);
    const fullPath = path.join(this.basePath, storagePath);
    
    await fs.writeFile(fullPath, fileBuffer);

    // Calculate hash if not provided
    if (!fileHash) {
      fileHash = await hashFile(fullPath);
    }

    // Create database record
    const fileRecord: NewFile = {
      id: fileId,
      userId,
      name: fileName,
      mimeType: mimeType || 'text/csv',
      size: fileBuffer.length,
      hash: fileHash,
      storageType: 'local',
      storagePath,
      path: `/${userId}/${fileName}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(files).values(fileRecord).returning();
    const inserted = Array.isArray(result) ? result[0] : result;
    if (!inserted) {
      throw new Error('Failed to insert file record');
    }
    return inserted;
  }

  /**
   * Store processed file
   */
  async storeProcessedFile(
    fileBuffer: Buffer,
    originalFileId: string,
    userId: string,
    processingJobId: string
  ): Promise<typeof files.$inferSelect> {
    // Get original file info
    const [originalFile] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, originalFileId), eq(files.userId, userId)))
      .limit(1);

    if (!originalFile) {
      throw new Error('Original file not found');
    }

    // Create processed file path
    const fileId = crypto.randomUUID();
    const userDir = path.join(this.basePath, userId);
    const fileDir = path.join(userDir, originalFileId);
    const storagePath = path.join(userId, originalFileId, `processed_${processingJobId}.csv`);
    const fullPath = path.join(this.basePath, storagePath);

    // Ensure directory exists for processed file
    try {
      await fs.mkdir(fileDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create directory for processed file:', fileDir, error);
      throw new Error(`Directory creation failed for processed file: ${error}`);
    }

    // Save processed file
    await fs.writeFile(fullPath, fileBuffer);

    // Calculate hash
    const fileHash = await hashFile(fullPath);

    // Create database record for processed file
    const processedRecord: NewFile = {
      id: fileId,
      userId,
      name: originalFile.name,
      mimeType: 'text/csv',
      size: fileBuffer.length,
      hash: fileHash,
      storageType: 'local',
      storagePath,
      path: `/${userId}/processed/${originalFile.name}`,
      parentId: originalFileId, // Link to original
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(files).values(processedRecord).returning();
    const inserted = Array.isArray(result) ? result[0] : result;
    if (!inserted) {
      throw new Error('Failed to insert processed file record');
    }
    return inserted;
  }

  /**
   * Get file path with auth check
   */
  async getFilePath(fileId: string, userId: string): Promise<string> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (!file) {
      throw new Error('File not found or access denied');
    }

    return path.join(this.basePath, file.storagePath);
  }

  /**
   * Read file contents
   */
  async readFile(fileId: string, userId: string): Promise<Buffer> {
    const filePath = await this.getFilePath(fileId, userId);
    return fs.readFile(filePath);
  }

  /**
   * Delete file from storage and database
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (!file) {
      throw new Error('File not found or access denied');
    }

    // Delete from storage
    const fullPath = path.join(this.basePath, file.storagePath);
    try {
      await fs.unlink(fullPath);
      
      // Try to clean up empty directories
      const fileDir = path.dirname(fullPath);
      const files = await fs.readdir(fileDir);
      if (files.length === 0) {
        await fs.rmdir(fileDir);
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
    }

    // Delete from database (cascade will handle related records)
    await db.delete(files).where(eq(files.id, fileId));
  }

  /**
   * Check if file exists by hash for a user
   */
  async checkFileByHash(
    hash: string,
    userId: string
  ): Promise<typeof files.$inferSelect | null> {
    const [existing] = await db
      .select()
      .from(files)
      .where(and(eq(files.hash, hash), eq(files.userId, userId)))
      .limit(1);

    return existing || null;
  }

  /**
   * Create a read stream for file download
   */
  async createReadStream(fileId: string, userId: string): Promise<NodeJS.ReadableStream> {
    const filePath = await this.getFilePath(fileId, userId);
    const fs = await import('fs');
    return fs.createReadStream(filePath);
  }

  /**
   * Get storage stats for a user
   */
  async getUserStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  }> {
    const userFiles = await db
      .select()
      .from(files)
      .where(eq(files.userId, userId));

    const stats = {
      totalFiles: userFiles.length,
      totalSize: userFiles.reduce((sum, file) => sum + (file.size || 0), 0),
      fileTypes: {} as Record<string, number>,
    };

    userFiles.forEach(file => {
      const ext = path.extname(file.name || '').toLowerCase();
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
    });

    return stats;
  }
}