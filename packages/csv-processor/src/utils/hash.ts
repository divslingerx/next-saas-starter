import crypto from 'crypto';
import fs from 'fs';
import { pipeline } from 'stream/promises';

/**
 * Hash a file using SHA-256
 * Efficient streaming implementation for large files
 */
export async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * Hash a buffer or string using SHA-256
 */
export function hashBuffer(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash CSV data array
 */
export function hashCsvData(data: any[][]): string {
  const jsonString = JSON.stringify(data);
  return hashBuffer(jsonString);
}

/**
 * Client-side file hashing (for browser)
 * This would be in a separate client utility file
 */
export async function hashFileClient(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Quick hash for large files (samples beginning, middle, end)
 */
export async function quickHashFile(filePath: string): Promise<string> {
  const stats = await fs.promises.stat(filePath);
  const fileSize = stats.size;
  const chunkSize = 1024 * 1024; // 1MB
  
  const hash = crypto.createHash('sha256');
  const fd = await fs.promises.open(filePath, 'r');
  
  try {
    // Read first chunk
    const firstChunk = Buffer.alloc(Math.min(chunkSize, fileSize));
    await fd.read(firstChunk, 0, firstChunk.length, 0);
    hash.update(firstChunk);
    
    // Read middle chunk if file is large enough
    if (fileSize > chunkSize * 2) {
      const middlePos = Math.floor(fileSize / 2) - Math.floor(chunkSize / 2);
      const middleChunk = Buffer.alloc(chunkSize);
      await fd.read(middleChunk, 0, chunkSize, middlePos);
      hash.update(middleChunk);
    }
    
    // Read last chunk if file is large enough
    if (fileSize > chunkSize) {
      const lastPos = Math.max(0, fileSize - chunkSize);
      const lastChunk = Buffer.alloc(Math.min(chunkSize, fileSize - lastPos));
      await fd.read(lastChunk, 0, lastChunk.length, lastPos);
      hash.update(lastChunk);
    }
    
    // Add file size to hash for additional uniqueness
    hash.update(fileSize.toString());
    
    return hash.digest('hex');
  } finally {
    await fd.close();
  }
}

/**
 * Compare two hashes
 */
export function compareHashes(hash1: string, hash2: string): boolean {
  return hash1.toLowerCase() === hash2.toLowerCase();
}