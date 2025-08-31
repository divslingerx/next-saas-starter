import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '@tmcdm/db';
import { files, csvProcessingJobs, type ProcessingConfig } from '@tmcdm/db/src/schema/files';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@tmcdm/auth/server';
import { FileStorageService, CsvProcessingService, hashBuffer } from '@tmcdm/csv-processor';
import * as fs from 'fs/promises';
import * as path from 'path';

// Define context type for Hono
type Variables = {
  userId: string;
  user: any;
};

const csv = new Hono<{ Variables: Variables }>();

// Initialize services with proper config
// Use absolute path for storage directory to avoid issues with relative paths
const storageBasePath = path.resolve(process.cwd(), 'storage');
const storageConfig = {
  basePath: storageBasePath,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: ['text/csv', 'application/csv']
};

// Ensure storage directory exists
(async () => {
  try {
    await fs.mkdir(storageBasePath, { recursive: true });
    console.log('Storage directory ensured at:', storageBasePath);
    
    // Check if directory is writable
    await fs.access(storageBasePath, fs.constants.W_OK);
    console.log('Storage directory is writable');
  } catch (error) {
    console.error('Failed to create or access storage directory:', error);
    console.error('Storage path:', storageBasePath);
  }
})();

const storageService = new FileStorageService(storageConfig);
const processingService = new CsvProcessingService(storageService);

// Auth middleware - CRITICAL: Protects all CSV routes
csv.use('/*', async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Store user info in context for route handlers
  c.set('userId', session.user.id);
  c.set('user', session.user);
  
  await next();
});

// 1. Check if file exists by hash
csv.post('/check', async (c) => {
  const userId = c.get('userId');
  
  try {
    const body = await c.req.json();
    const { hash } = z.object({
      hash: z.string().length(64), // SHA-256 hash
    }).parse(body);

    const existingFile = await storageService.checkFileByHash(hash, userId);
    
    if (existingFile) {
      // Check if we have processing results for this file
      const [job] = await db.select()
        .from(csvProcessingJobs)
        .where(and(
          eq(csvProcessingJobs.originalHash, hash),
          eq(csvProcessingJobs.userId, userId),
          eq(csvProcessingJobs.status, 'completed')
        ))
        .orderBy(desc(csvProcessingJobs.createdAt))
        .limit(1);

      return c.json({
        exists: true,
        file: {
          id: existingFile.id,
          name: existingFile.name,
          size: existingFile.size,
          hash: existingFile.hash,
          createdAt: existingFile.createdAt,
        },
        processingJob: job ? {
          id: job.id,
          status: job.status,
          processedFileId: job.processedFileId,
          processedHash: job.processedHash,
        } : null,
      });
    }

    return c.json({ exists: false });
  } catch (error) {
    console.error('Check error:', error);
    return c.json({ error: 'Failed to check file' }, 500);
  }
});

// 2. Upload CSV file
csv.post('/upload', async (c) => {
  const userId = c.get('userId');
  
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const metadata = formData.get('metadata');
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Parse optional metadata
    const parsedMetadata = metadata ? JSON.parse(metadata as string) : {};
    
    // Get file buffer and calculate hash
    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = hashBuffer(buffer);
    
    // Check if file already exists
    const existingFile = await storageService.checkFileByHash(hash, userId);
    if (existingFile) {
      // Construct full path for the existing file
      const fullPath = path.join(storageBasePath, existingFile.storagePath);
      
      // Ensure the file exists before trying to read it
      let fileExists = false;
      try {
        await fs.access(fullPath);
        fileExists = true;
      } catch (error) {
        console.error('Existing file not found on disk:', fullPath);
        console.log('Will re-upload the file since the physical file is missing');
      }
      
      if (fileExists) {
        // Get preview for the existing file
        const preview = await processingService.getPreview(fullPath, 100);
        
        return c.json({
          message: 'File already exists',
          file: {
            id: existingFile.id,
            name: existingFile.name,
            size: existingFile.size,
            hash: existingFile.hash,
          },
          preview: {
            rows: preview.rows,
            totalRows: preview.totalRows,
            columns: preview.columns,
          },
        });
      }
      
      // If file doesn't exist on disk, continue with new upload
      console.log('File record exists but file is missing, treating as new upload');
    }

    // Store original file
    const storedFile = await storageService.storeFile(
      buffer,
      file.name,
      userId,
      file.type || 'text/csv',
      hash
    );

    // Automatically create and start processing job
    const job = await processingService.createJob(
      storedFile.id,
      userId,
      {} // Empty config = just remove empty columns
    );

    // Start processing asynchronously
    processingService.processJob(job.id).catch((error: any) => {
      console.error('Auto-processing error:', error);
    });

    // Get preview with empty columns removed (first 100 rows)
    const fullPath = path.join(storageBasePath, storedFile.storagePath);
    const preview = await processingService.getPreview(fullPath, 100);

    return c.json({
      message: 'File uploaded and processing started',
      file: {
        id: storedFile.id,
        name: storedFile.name,
        size: storedFile.size,
        hash: storedFile.hash,
        createdAt: storedFile.createdAt,
      },
      job: {
        id: job.id,
        status: job.status,
      },
      preview: {
        rows: preview.rows,
        totalRows: preview.totalRows,
        columns: preview.columns,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// 3. Process CSV file
csv.post('/process', async (c) => {
  const userId = c.get('userId');
  
  try {
    const body = await c.req.json();
    const processRequest = z.object({
      fileId: z.string().uuid(),
      config: z.object({
        removeDuplicates: z.boolean().optional(),
        duplicateCheckColumns: z.array(z.string()).optional(),
        mergeColumns: z.array(z.string()).optional(),
        mergeDelimiter: z.string().optional(),
        columnMappings: z.record(z.string()).optional(),
        pipeline: z.string().optional(),
      }).optional(),
    }).parse(body);

    // Verify file belongs to user
    const [file] = await db.select()
      .from(files)
      .where(and(
        eq(files.id, processRequest.fileId),
        eq(files.userId, userId)
      ))
      .limit(1);

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Create processing job
    const job = await processingService.createJob(
      file.id,
      userId,
      processRequest.config as ProcessingConfig || {}
    );

    // Start processing asynchronously
    processingService.processJob(job.id).catch((error: any) => {
      console.error('Processing error:', error);
    });

    return c.json({
      message: 'Processing started',
      job: {
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    console.error('Process error:', error);
    return c.json({ error: 'Failed to start processing' }, 500);
  }
});

// 4. Get processing job status
csv.get('/jobs/:jobId', async (c) => {
  const userId = c.get('userId');
  const jobId = c.req.param('jobId');
  
  try {
    const [job] = await db.select()
      .from(csvProcessingJobs)
      .where(and(
        eq(csvProcessingJobs.id, jobId),
        eq(csvProcessingJobs.userId, userId)
      ))
      .limit(1);

    if (!job) {
      return c.json({ error: 'Job not found' }, 404);
    }

    return c.json({
      job: {
        id: job.id,
        status: job.status,
        progress: job.processingProgress,
        originalFileId: job.originalFileId,
        processedFileId: job.processedFileId,
        processedHash: job.processedHash,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.processingCompletedAt,
        config: job.processingConfig,
        originalPreview: job.originalPreview,
        processedPreview: job.processedPreview,
      },
    });
  } catch (error) {
    console.error('Job status error:', error);
    return c.json({ error: 'Failed to get job status' }, 500);
  }
});

// 5. List user's files
csv.get('/files', async (c) => {
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const parentId = c.req.query('parentId') || null;
  const processedOnly = c.req.query('processed') === 'true';
  
  try {
    if (processedOnly) {
      // Different approach: Get original files that have been uploaded by the user
      // and their latest processing job status
      const userFiles = await db.select()
        .from(files)
        .where(and(
          eq(files.userId, userId),
          sql`${files.parentId} IS NULL`, // Only get top-level files (originals)
          eq(files.mimeType, 'text/csv')
        ))
        .orderBy(desc(files.createdAt));
      
      console.log(`Found ${userFiles.length} original CSV files for user ${userId}`);
      
      // For each file, get its latest processing job
      const filesWithJobs = await Promise.all(userFiles.map(async (file) => {
        const [latestJob] = await db.select()
          .from(csvProcessingJobs)
          .where(and(
            eq(csvProcessingJobs.originalFileId, file.id),
            eq(csvProcessingJobs.userId, userId)
          ))
          .orderBy(desc(csvProcessingJobs.createdAt))
          .limit(1);
        
        // If there's a completed job with a processed file, use that file's info
        if (latestJob?.status === 'completed' && latestJob.processedFileId) {
          const [processedFile] = await db.select()
            .from(files)
            .where(eq(files.id, latestJob.processedFileId))
            .limit(1);
          
          if (processedFile) {
            return {
              id: processedFile.id, // Use processed file ID for operations
              name: file.name, // Keep original name
              size: processedFile.size, // Use processed size
              hash: processedFile.hash, // Use processed hash
              createdAt: file.createdAt, // Keep original creation date
              updatedAt: processedFile.updatedAt,
              processingJob: {
                id: latestJob.id,
                status: latestJob.status,
                processedRowCount: latestJob.processedRowCount,
                processedColumnCount: latestJob.processedColumnCount,
                originalFileId: latestJob.originalFileId,
                processingCompletedAt: latestJob.processingCompletedAt,
              }
            };
          }
        }
        
        // Return original file with job status (or no job)
        return {
          id: file.id,
          name: file.name,
          size: file.size,
          hash: file.hash,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          processingJob: latestJob ? {
            id: latestJob.id,
            status: latestJob.status,
            processedRowCount: latestJob.processedRowCount,
            processedColumnCount: latestJob.processedColumnCount,
            originalFileId: latestJob.originalFileId,
            processingCompletedAt: latestJob.processingCompletedAt,
          } : null
        };
      }));
      
      // Apply pagination
      const paginatedFiles = filesWithJobs.slice(offset, offset + limit);
      
      console.log(`Returning ${paginatedFiles.length} files with processing status`);
      return c.json(paginatedFiles);
    }

    // Original file listing logic
    const conditions = [eq(files.userId, userId)];
    if (parentId) {
      conditions.push(eq(files.parentId, parentId));
    } else {
      conditions.push(sql`${files.parentId} IS NULL`);
    }

    const userFiles = await db.select({
      id: files.id,
      name: files.name,
      size: files.size,
      hash: files.hash,
      mimeType: files.mimeType,
      isFolder: files.isFolder,
      parentId: files.parentId,
      createdAt: files.createdAt,
      updatedAt: files.updatedAt,
    })
      .from(files)
      .where(and(...conditions))
      .orderBy(desc(files.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
      .from(files)
      .where(and(...conditions));
    const count = countResult[0]?.count || 0;

    return c.json({
      files: userFiles,
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('List files error:', error);
    return c.json({ error: 'Failed to list files' }, 500);
  }
});

// 6. List user's processing jobs
csv.get('/jobs', async (c) => {
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const status = c.req.query('status');
  
  try {
    const conditions = [eq(csvProcessingJobs.userId, userId)];
    if (status) {
      conditions.push(eq(csvProcessingJobs.status, status));
    }

    const jobs = await db.select({
      id: csvProcessingJobs.id,
      status: csvProcessingJobs.status,
      progress: csvProcessingJobs.processingProgress,
      originalFileId: csvProcessingJobs.originalFileId,
      processedFileId: csvProcessingJobs.processedFileId,
      error: csvProcessingJobs.error,
      createdAt: csvProcessingJobs.createdAt,
      completedAt: csvProcessingJobs.processingCompletedAt,
    })
      .from(csvProcessingJobs)
      .where(and(...conditions))
      .orderBy(desc(csvProcessingJobs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
      .from(csvProcessingJobs)
      .where(and(...conditions));
    const count = countResult[0]?.count || 0;

    return c.json({
      jobs,
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('List jobs error:', error);
    return c.json({ error: 'Failed to list jobs' }, 500);
  }
});

// 7. Download file
csv.get('/files/:fileId/download', async (c) => {
  const userId = c.get('userId');
  const fileId = c.req.param('fileId');
  
  try {
    const [file] = await db.select()
      .from(files)
      .where(and(
        eq(files.id, fileId),
        eq(files.userId, userId)
      ))
      .limit(1);

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Read file from storage
    const filePath = path.resolve(file.storagePath);
    const fileBuffer = await fs.readFile(filePath);

    // Set appropriate headers
    c.header('Content-Type', file.mimeType || 'application/octet-stream');
    c.header('Content-Disposition', `attachment; filename="${file.name}"`);
    c.header('Content-Length', file.size.toString());

    return c.body(fileBuffer);
  } catch (error) {
    console.error('Download error:', error);
    return c.json({ error: 'Failed to download file' }, 500);
  }
});

// 8. Delete file
csv.delete('/files/:fileId', async (c) => {
  const userId = c.get('userId');
  const fileId = c.req.param('fileId');
  
  try {
    const [file] = await db.select()
      .from(files)
      .where(and(
        eq(files.id, fileId),
        eq(files.userId, userId)
      ))
      .limit(1);

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Delete from database (will cascade to jobs)
    await db.delete(files)
      .where(and(
        eq(files.id, fileId),
        eq(files.userId, userId)
      ));

    // Note: Not deleting physical file as per requirements (external cleanup)
    
    return c.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

// 9. Export processed CSV file
csv.get('/files/:fileId/export', async (c) => {
  const userId = c.get('userId');
  const fileId = c.req.param('fileId');
  
  try {
    // First, check if this is already a processed file
    const [directFile] = await db.select()
      .from(files)
      .where(and(
        eq(files.id, fileId),
        eq(files.userId, userId)
      ))
      .limit(1);

    if (!directFile) {
      return c.json({ error: 'File not found' }, 404);
    }

    let processedFile = directFile;

    // Check if this file is a processed file (has a job pointing to it)
    const [jobAsProcessed] = await db.select()
      .from(csvProcessingJobs)
      .where(and(
        eq(csvProcessingJobs.processedFileId, fileId),
        eq(csvProcessingJobs.userId, userId),
        eq(csvProcessingJobs.status, 'completed')
      ))
      .limit(1);

    // If it's not a processed file, look for its processed version
    if (!jobAsProcessed) {
      const [job] = await db.select()
        .from(csvProcessingJobs)
        .where(and(
          eq(csvProcessingJobs.originalFileId, fileId),
          eq(csvProcessingJobs.userId, userId),
          eq(csvProcessingJobs.status, 'completed')
        ))
        .orderBy(desc(csvProcessingJobs.createdAt))
        .limit(1);

      if (!job || !job.processedFileId) {
        // No processed version exists, export the original
        processedFile = directFile;
      } else {
        // Get the processed file
        const [pFile] = await db.select()
          .from(files)
          .where(and(
            eq(files.id, job.processedFileId),
            eq(files.userId, userId)
          ))
          .limit(1);

        if (pFile) {
          processedFile = pFile;
        }
      }
    }

    // Read the processed file
    const fullPath = path.join(storageBasePath, processedFile.storagePath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      console.error('Export file not found on disk:', fullPath);
      return c.json({ error: 'File not found on disk' }, 404);
    }
    
    const fileBuffer = await fs.readFile(fullPath);

    // Set appropriate headers for download
    const downloadName = processedFile.name.replace('.csv', '_processed.csv');
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="${downloadName}"`);
    c.header('Content-Length', processedFile.size.toString());

    return c.body(fileBuffer);
  } catch (error) {
    console.error('Export error:', error);
    return c.json({ error: 'Failed to export file' }, 500);
  }
});

// 10. Get paginated preview of CSV file
csv.get('/files/:fileId/preview', async (c) => {
  const userId = c.get('userId');
  const fileId = c.req.param('fileId');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');
  const processed = c.req.query('processed') === 'true';
  
  try {
    // Validate limit
    if (limit < 1 || limit > 1000) {
      return c.json({ error: 'Limit must be between 1 and 1000' }, 400);
    }

    // Get file or job
    if (processed) {
      // First check if fileId is a processed file ID
      const [jobByProcessedId] = await db.select()
        .from(csvProcessingJobs)
        .where(and(
          eq(csvProcessingJobs.processedFileId, fileId),
          eq(csvProcessingJobs.userId, userId),
          eq(csvProcessingJobs.status, 'completed')
        ))
        .orderBy(desc(csvProcessingJobs.createdAt))
        .limit(1);
      
      let job = jobByProcessedId;
      
      // If not found, try looking for job by originalFileId
      if (!job) {
        const [jobByOriginalId] = await db.select()
          .from(csvProcessingJobs)
          .where(and(
            eq(csvProcessingJobs.originalFileId, fileId),
            eq(csvProcessingJobs.userId, userId),
            eq(csvProcessingJobs.status, 'completed')
          ))
          .orderBy(desc(csvProcessingJobs.createdAt))
          .limit(1);
        
        job = jobByOriginalId;
      }

      if (!job) {
        return c.json({ error: 'No processed version available' }, 404);
      }

      // Return processed preview from job
      const preview = job.processedPreview as any[][] || [];
      const headers = preview[0] || [];
      const dataRows = preview.slice(1);
      
      // Apply pagination
      const paginatedRows = dataRows.slice(offset, offset + limit);
      
      return c.json({
        preview: {
          headers,
          rows: paginatedRows,
          totalRows: job.processedRowCount || 0,
          totalColumns: job.processedColumnCount || 0,
          pagination: {
            limit,
            offset,
            hasMore: offset + limit < dataRows.length
          }
        },
        metadata: {
          fileId: job.processedFileId,
          hash: job.processedHash,
          status: job.status,
          processedAt: job.processingCompletedAt
        }
      });
    } else {
      // Get original file
      const [file] = await db.select()
        .from(files)
        .where(and(
          eq(files.id, fileId),
          eq(files.userId, userId)
        ))
        .limit(1);

      if (!file) {
        return c.json({ error: 'File not found' }, 404);
      }

      // Get the job to access original preview
      const [job] = await db.select()
        .from(csvProcessingJobs)
        .where(and(
          eq(csvProcessingJobs.originalFileId, fileId),
          eq(csvProcessingJobs.userId, userId)
        ))
        .orderBy(desc(csvProcessingJobs.createdAt))
        .limit(1);

      if (job && job.originalPreview) {
        // Use cached preview from job
        const preview = job.originalPreview as any[][] || [];
        const headers = preview[0] || [];
        const dataRows = preview.slice(1);
        
        // Apply pagination
        const paginatedRows = dataRows.slice(offset, offset + limit);
        
        return c.json({
          preview: {
            headers,
            rows: paginatedRows,
            totalRows: job.originalRowCount || 0,
            totalColumns: job.originalColumnCount || 0,
            pagination: {
              limit,
              offset,
              hasMore: offset + limit < dataRows.length
            }
          },
          metadata: {
            fileId: file.id,
            hash: file.hash,
            fileName: file.name,
            fileSize: file.size
          }
        });
      } else {
        // Read file directly if no job exists
        const filePath = path.resolve(file.storagePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        // Parse CSV
        const lines = fileContent.split('\n').filter(line => line.trim());
        const rows = lines.map(line => {
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          return matches ? matches.map(m => m.replace(/^"(.*)"$/, '$1').trim()) : [];
        });
        
        const headers = rows[0] || [];
        const dataRows = rows.slice(1);
        
        // Apply pagination
        const paginatedRows = dataRows.slice(offset, offset + limit);
        
        return c.json({
          preview: {
            headers,
            rows: paginatedRows,
            totalRows: rows.length,
            totalColumns: headers.length,
            pagination: {
              limit,
              offset,
              hasMore: offset + limit < dataRows.length
            }
          },
          metadata: {
            fileId: file.id,
            hash: file.hash,
            fileName: file.name,
            fileSize: file.size
          }
        });
      }
    }
  } catch (error) {
    console.error('Preview error:', error);
    return c.json({ error: 'Failed to get preview' }, 500);
  }
});

export default csv;