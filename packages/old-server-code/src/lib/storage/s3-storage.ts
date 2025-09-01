/**
 * S3 Storage Service
 * Handles file storage operations using AWS S3 SDK (compatible with MinIO, Cloudflare R2, DigitalOcean Spaces, etc.)
 */

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  DeleteObjectsCommand, 
  HeadObjectCommand, 
  ListObjectsV2Command,
  CopyObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface S3Config {
  region?: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  forcePathStyle?: boolean;
}

interface UploadOptions {
  organizationId: string;
  fileName: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export class S3StorageService {
  private client: S3Client;
  private defaultBucket: string = 'uploads';

  constructor(config?: S3Config) {
    // Default config for MinIO local development
    const s3Config: S3Config = config || {
      region: 'us-east-1',
      endpoint: 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minio_admin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minio_password',
      },
      forcePathStyle: true, // Required for MinIO
    };

    this.client = new S3Client(s3Config);
  }

  /**
   * Initialize S3 buckets if they don't exist
   */
  async initialize(): Promise<void> {
    const buckets = [
      'uploads',
      'screenshots', 
      'exports'
    ];

    for (const bucket of buckets) {
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          try {
            await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
            console.log(`✅ Created S3 bucket: ${bucket}`);
          } catch (createError) {
            console.error(`❌ Failed to create bucket ${bucket}:`, createError);
          }
        } else {
          console.error(`❌ Error checking bucket ${bucket}:`, error);
        }
      }
    }
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    content: Buffer,
    key: string,
    options: UploadOptions
  ): Promise<{
    key: string;
    url: string;
    etag: string;
  }> {
    const { organizationId, fileName, contentType, metadata = {} } = options;
    
    // Add organization-scoped path
    const objectKey = `${organizationId}/${key}`;
    
    // Add default metadata
    const fullMetadata = {
      ...metadata,
      'organization-id': organizationId,
      'original-filename': fileName,
      'uploaded-at': new Date().toISOString(),
    };

    const command = new PutObjectCommand({
      Bucket: this.defaultBucket,
      Key: objectKey,
      Body: content,
      ContentType: contentType,
      Metadata: fullMetadata,
    });

    const result = await this.client.send(command);

    return {
      key: objectKey,
      url: await this.getFileUrl(objectKey),
      etag: result.ETag || '',
    };
  }

  /**
   * Download a file from S3
   */
  async downloadFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.defaultBucket,
      Key: key,
    });

    const response = await this.client.send(command);
    
    if (!response.Body) {
      throw new Error('No file content received');
    }

    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Get a presigned URL for file access
   */
  async getFileUrl(key: string, expiry: number = 24 * 60 * 60): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.defaultBucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn: expiry });
  }

  /**
   * Get a presigned URL for file upload
   */
  async getUploadUrl(key: string, expiry: number = 60 * 60): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.defaultBucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn: expiry });
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.defaultBucket,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Delete multiple files from S3
   */
  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: this.defaultBucket,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
      },
    });

    await this.client.send(command);
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.defaultBucket,
        Key: key,
      }));
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<{
    size: number;
    etag: string;
    lastModified: Date;
    metadata: Record<string, string>;
  }> {
    const command = new HeadObjectCommand({
      Bucket: this.defaultBucket,
      Key: key,
    });

    const response = await this.client.send(command);
    
    return {
      size: response.ContentLength || 0,
      etag: response.ETag || '',
      lastModified: response.LastModified || new Date(),
      metadata: response.Metadata || {},
    };
  }

  /**
   * List files with prefix (for organization-scoped listing)
   */
  async listFiles(
    organizationId: string,
    prefix?: string,
    maxKeys: number = 1000
  ): Promise<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }[]> {
    const fullPrefix = prefix 
      ? `${organizationId}/${prefix}`
      : `${organizationId}/`;

    const command = new ListObjectsV2Command({
      Bucket: this.defaultBucket,
      Prefix: fullPrefix,
      MaxKeys: maxKeys,
    });

    const response = await this.client.send(command);
    
    return (response.Contents || [])
      .filter(obj => obj.Key && obj.Size !== undefined)
      .map(obj => ({
        key: obj.Key!,
        size: obj.Size!,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || '',
      }));
  }

  /**
   * Copy a file within S3
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.defaultBucket,
      CopySource: `${this.defaultBucket}/${sourceKey}`,
      Key: destinationKey,
    });

    await this.client.send(command);
  }

  /**
   * Get storage usage for an organization
   */
  async getStorageUsage(organizationId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    lastModified: Date | null;
  }> {
    const files = await this.listFiles(organizationId);
    
    return {
      totalFiles: files.length,
      totalSize: files.reduce((total, file) => total + file.size, 0),
      lastModified: files.length > 0 
        ? files.reduce((latest, file) => 
            file.lastModified > latest ? file.lastModified : latest, 
            files[0]!.lastModified
          )
        : null,
    };
  }
}

// Singleton instance - can be configured for different environments
export const s3Storage = new S3StorageService();