/**
 * Files Service
 * Business logic for file and directory management
 */

import { FilesRepository } from "../repositories/files.repository";
import { BusinessException, ValidationException } from "@/core/exceptions/base.exception";
import { withCancellation } from "@/core/utils/cancellation";
import { globalContext } from "@/core/context/global-context";
import { s3Storage } from "@/lib/storage/s3-storage";
import type { ServiceOptions } from "@/core/types/service-options";
import type {
  FileDto,
  DirectoryDto,
  FileVersionDto,
  CreateFileDto,
  UpdateFileDto,
  CreateDirectoryDto,
  UpdateDirectoryDto,
  CreateFileVersionDto,
  FileWithVersionsDto,
  DirectoryWithContentsDto,
  FileUploadDto,
  FileSearchDto,
  FileMoveDto,
  DirectoryMoveDto,
  BulkFileOperationDto,
  FileStatsDto,
  StorageStatsDto,
  FileCleanupDto,
} from "../dto/files.dto";

export class FilesService {
  private readonly repository: FilesRepository;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds for file operations

  constructor() {
    this.repository = new FilesRepository();
  }

  /**
   * Get all files for an organization
   */
  async getFiles(
    organizationId: string,
    includeRemoved: boolean = false,
    options?: ServiceOptions
  ): Promise<FileDto[]> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.findFilesByOrganization(organizationId, includeRemoved),
      signal,
      timeout
    );
  }

  /**
   * Get a specific file by ID
   */
  async getFileById(
    id: number,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<FileDto | null> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.findFileById(id, organizationId),
      signal,
      timeout
    );
  }

  /**
   * Get a file with all its versions
   */
  async getFileWithVersions(
    id: number,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<FileWithVersionsDto | null> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.findFileWithVersions(id, organizationId),
      signal,
      timeout
    );
  }

  /**
   * Search files based on criteria
   */
  async searchFiles(
    searchDto: FileSearchDto,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<FileDto[]> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.searchFiles(searchDto, organizationId),
      signal,
      timeout
    );
  }

  /**
   * Upload a new file
   */
  async uploadFile(
    uploadDto: FileUploadDto,
    organizationId: string,
    createdByMembershipId?: string,
    options?: ServiceOptions
  ): Promise<FileWithVersionsDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    // Validate directory exists if specified
    if (uploadDto.directoryId) {
      const directory = await this.repository.findDirectoryById(uploadDto.directoryId, organizationId);
      if (!directory) {
        throw new ValidationException("Directory not found");
      }
    }

    // Generate content hash for deduplication
    const crypto = await import('crypto');
    const contentHash = crypto.createHash('sha256').update(uploadDto.content).digest('hex');

    // Check for existing file with same content
    const existingFiles = await this.repository.searchFiles({}, organizationId);
    const duplicateFile = existingFiles.find(f => f.contentHash === contentHash);

    return withCancellation(
      this.performFileUpload(uploadDto, organizationId, createdByMembershipId, contentHash, duplicateFile),
      signal,
      timeout
    );
  }

  private async performFileUpload(
    uploadDto: FileUploadDto,
    organizationId: string,
    createdByMembershipId?: string,
    contentHash?: string,
    duplicateFile?: FileDto
  ): Promise<FileWithVersionsDto> {
    // Generate storage key
    const timestamp = Date.now();
    const storageKey = `files/${timestamp}-${uploadDto.name}`;
    
    // Upload to S3
    const s3Result = await s3Storage.uploadFile(
      uploadDto.content,
      storageKey,
      {
        organizationId,
        fileName: uploadDto.name,
        contentType: uploadDto.mimeType,
        metadata: uploadDto.metadata ? 
          Object.entries(uploadDto.metadata).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>) : 
          {}
      }
    );

    // Create file record
    const createFileDto: CreateFileDto = {
      name: uploadDto.name,
      key: s3Result.key,
      directoryId: uploadDto.directoryId,
      organizationId,
      createdByMembershipId,
      contentHash,
      totalSize: uploadDto.size,
      versionCount: 1,
    };

    const newFile = await this.repository.createFile(createFileDto);

    // Create first version
    const versionDto: CreateFileVersionDto = {
      fileId: newFile.id!,
      version: 1,
      isLatest: true,
      mimeType: uploadDto.mimeType,
      size: uploadDto.size,
      contentHash: contentHash || '',
      storageKey: s3Result.key,
      storageProvider: 's3',
      organizationId,
      createdByMembershipId,
      metadata: uploadDto.metadata || {},
    };

    const version = await this.repository.createFileVersion(versionDto);

    // Update file's current version
    await this.repository.updateFile(newFile.id!, organizationId, {
      currentVersionId: version.id,
    });

    // Return file with versions
    const result = await this.repository.findFileWithVersions(newFile.id!, organizationId);
    if (!result) {
      throw new BusinessException("Failed to retrieve uploaded file");
    }

    return result;
  }

  /**
   * Update file metadata
   */
  async updateFile(
    id: number,
    updateDto: UpdateFileDto,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<FileDto | null> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.updateFile(id, organizationId, updateDto),
      signal,
      timeout
    );
  }

  /**
   * Move a file to a different directory
   */
  async moveFile(
    moveDto: FileMoveDto,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<boolean> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    // Validate target directory exists if specified
    if (moveDto.targetDirectoryId) {
      const directory = await this.repository.findDirectoryById(moveDto.targetDirectoryId, organizationId);
      if (!directory) {
        throw new ValidationException("Target directory not found");
      }
    }

    return withCancellation(
      this.repository.moveFile(moveDto.fileId, organizationId, moveDto.targetDirectoryId),
      signal,
      timeout
    );
  }

  /**
   * Soft delete a file
   */
  async deleteFile(
    id: number,
    organizationId: string,
    removedByMembershipId?: string,
    options?: ServiceOptions
  ): Promise<boolean> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.softDeleteFile(id, organizationId, removedByMembershipId),
      signal,
      timeout
    );
  }

  /**
   * Restore a soft-deleted file
   */
  async restoreFile(
    id: number,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<boolean> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.restoreFile(id, organizationId),
      signal,
      timeout
    );
  }

  // Directory methods

  /**
   * Get all directories for an organization
   */
  async getDirectories(
    organizationId: string,
    includeRemoved: boolean = false,
    options?: ServiceOptions
  ): Promise<DirectoryDto[]> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.findDirectoriesByOrganization(organizationId, includeRemoved),
      signal,
      timeout
    );
  }

  /**
   * Get a directory with its contents
   */
  async getDirectoryWithContents(
    id: number,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<DirectoryWithContentsDto | null> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.findDirectoryWithContents(id, organizationId),
      signal,
      timeout
    );
  }

  /**
   * Create a new directory
   */
  async createDirectory(
    createDto: CreateDirectoryDto,
    organizationId: string,
    createdByMembershipId?: string,
    options?: ServiceOptions
  ): Promise<DirectoryDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    // Validate parent directory exists if specified
    if (createDto.parentId) {
      const parent = await this.repository.findDirectoryById(createDto.parentId, organizationId);
      if (!parent) {
        throw new ValidationException("Parent directory not found");
      }
      
      // Calculate depth and path
      createDto.depth = (parent.depth || 0) + 1;
      createDto.path = parent.path ? `${parent.path}/${createDto.name}` : createDto.name;
    } else {
      createDto.depth = 0;
      createDto.path = createDto.name;
    }

    createDto.organizationId = organizationId;
    createDto.createdByMembershipId = createdByMembershipId;

    return withCancellation(
      this.repository.createDirectory(createDto),
      signal,
      timeout
    );
  }

  /**
   * Update directory metadata
   */
  async updateDirectory(
    id: number,
    updateDto: UpdateDirectoryDto,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<DirectoryDto | null> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.updateDirectory(id, organizationId, updateDto),
      signal,
      timeout
    );
  }

  /**
   * Move a directory
   */
  async moveDirectory(
    moveDto: DirectoryMoveDto,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<boolean> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    // Validate parent directory exists if specified
    if (moveDto.parentId) {
      const parent = await this.repository.findDirectoryById(moveDto.parentId, organizationId);
      if (!parent) {
        throw new ValidationException("Parent directory not found");
      }
      
      // Prevent circular references
      const directory = await this.repository.findDirectoryById(moveDto.directoryId, organizationId);
      if (directory && this.isCircularReference(directory, parent)) {
        throw new ValidationException("Cannot move directory to its own subdirectory");
      }
    }

    return withCancellation(
      this.repository.moveDirectory(moveDto.directoryId, organizationId, moveDto.parentId),
      signal,
      timeout
    );
  }

  private isCircularReference(directory: DirectoryDto, targetParent: DirectoryDto): boolean {
    // Simple check - in a real implementation, you'd trace the full path
    if (directory.id === targetParent.id) return true;
    if (directory.id === targetParent.parentId) return true;
    return false;
  }

  /**
   * Soft delete a directory
   */
  async deleteDirectory(
    id: number,
    organizationId: string,
    removedByMembershipId?: string,
    options?: ServiceOptions
  ): Promise<boolean> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.softDeleteDirectory(id, organizationId, removedByMembershipId),
      signal,
      timeout
    );
  }

  // File Version methods

  /**
   * Create a new version of a file
   */
  async createFileVersion(
    fileId: number,
    versionDto: Omit<CreateFileVersionDto, 'fileId' | 'organizationId'>,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<FileVersionDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    // Validate file exists
    const file = await this.repository.findFileById(fileId, organizationId);
    if (!file) {
      throw new ValidationException("File not found");
    }

    // Get current version count
    const existingVersions = await this.repository.findFileVersions(fileId, organizationId);
    const nextVersion = Math.max(...existingVersions.map(v => v.version), 0) + 1;

    const createDto: CreateFileVersionDto = {
      ...versionDto,
      fileId,
      organizationId,
      version: nextVersion,
      isLatest: false, // Will be set by setCurrentVersion if needed
    };

    return withCancellation(
      this.repository.createFileVersion(createDto),
      signal,
      timeout
    );
  }

  /**
   * Set a specific version as current
   */
  async setCurrentVersion(
    fileId: number,
    versionId: number,
    organizationId: string,
    options?: ServiceOptions
  ): Promise<boolean> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.setCurrentVersion(fileId, versionId, organizationId),
      signal,
      timeout
    );
  }

  // Statistics and cleanup methods

  /**
   * Get file statistics for an organization
   */
  async getFileStats(
    organizationId: string,
    options?: ServiceOptions
  ): Promise<FileStatsDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.getFileStats(organizationId),
      signal,
      timeout
    );
  }

  /**
   * Perform bulk operations on files
   */
  async bulkFileOperation(
    operationDto: BulkFileOperationDto,
    organizationId: string,
    membershipId?: string,
    options?: ServiceOptions
  ): Promise<{ success: number; failed: number }> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    let success = 0;
    let failed = 0;

    const operations = operationDto.fileIds.map(async (fileId) => {
      try {
        switch (operationDto.action) {
          case 'move':
            if (!operationDto.targetDirectoryId) {
              throw new ValidationException("Target directory required for move operation");
            }
            await this.repository.moveFile(fileId, organizationId, operationDto.targetDirectoryId);
            break;
          case 'remove':
            await this.repository.softDeleteFile(fileId, organizationId, membershipId);
            break;
          case 'restore':
            await this.repository.restoreFile(fileId, organizationId);
            break;
          default:
            throw new ValidationException(`Unknown action: ${operationDto.action}`);
        }
        success++;
      } catch (error) {
        failed++;
        console.error(`Bulk operation failed for file ${fileId}:`, error);
      }
    });

    return withCancellation(
      Promise.all(operations).then(() => ({ success, failed })),
      signal,
      timeout
    );
  }

  /**
   * Clean up files eligible for hard deletion
   */
  async cleanupEligibleFiles(options?: ServiceOptions): Promise<FileCleanupDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    const eligibleFiles = await this.repository.findFilesEligibleForHardDelete();
    const eligibleDirectories = await this.repository.findDirectoriesEligibleForHardDelete();

    // In a real implementation, you'd actually delete the files and clean up storage
    const result: FileCleanupDto = {
      eligibleForHardDelete: eligibleFiles.length + eligibleDirectories.length,
      oldVersions: 0, // Would need to implement version cleanup logic
      duplicateFiles: 0, // Would need to implement duplicate detection
      estimatedSpaceRecoverable: eligibleFiles.reduce((sum, file) => sum + (file.totalSize || 0), 0),
    };

    return withCancellation(Promise.resolve(result), signal, timeout);
  }

  /**
   * Get a download URL for a file
   */
  async getFileDownloadUrl(
    id: number,
    organizationId: string,
    versionId?: number,
    options?: ServiceOptions
  ): Promise<string> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    // Get file version
    let fileVersion: FileVersionDto | null;
    if (versionId) {
      fileVersion = await this.repository.findFileVersionById(versionId, organizationId);
    } else {
      const fileWithVersions = await this.repository.findFileWithVersions(id, organizationId);
      fileVersion = fileWithVersions?.currentVersion || null;
    }

    if (!fileVersion) {
      throw new BusinessException("File version not found");
    }

    // Generate presigned URL from S3
    if (fileVersion.storageProvider === 's3' || fileVersion.storageProvider === 'minio') {
      return await s3Storage.getFileUrl(fileVersion.storageKey);
    }

    // Fallback for legacy files
    throw new BusinessException("File storage provider not supported");
  }

  /**
   * Initialize S3 storage (should be called on service startup)
   */
  async initializeStorage(): Promise<void> {
    await s3Storage.initialize();
  }

  /**
   * Physically delete files from storage (for hard delete operations)
   */
  async hardDeleteFiles(
    fileIds: number[],
    organizationId: string,
    options?: ServiceOptions
  ): Promise<{ deleted: number; failed: number }> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    let deleted = 0;
    let failed = 0;

    for (const fileId of fileIds) {
      try {
        // Get all file versions
        const fileWithVersions = await this.repository.findFileWithVersions(fileId, organizationId);
        if (!fileWithVersions) {
          failed++;
          continue;
        }

        // Delete from storage
        const storageKeys = fileWithVersions.versions
          .filter(v => v.storageProvider === 's3' || v.storageProvider === 'minio')
          .map(v => v.storageKey);

        if (storageKeys.length > 0) {
          await s3Storage.deleteFiles(storageKeys);
        }

        // Delete from database
        await this.repository.hardDeleteFile(fileId, organizationId);
        deleted++;
      } catch (error) {
        console.error(`Failed to hard delete file ${fileId}:`, error);
        failed++;
      }
    }

    return { deleted, failed };
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(organizationId: string): Promise<StorageStatsDto> {
    const s3Stats = await s3Storage.getStorageUsage(organizationId);
    const dbStats = await this.repository.getStorageStats(organizationId);

    return {
      totalUsed: s3Stats.totalSize,
      totalAvailable: 1024 * 1024 * 1024 * 10, // 10GB default limit
      usagePercentage: (s3Stats.totalSize / (1024 * 1024 * 1024 * 10)) * 100,
      deduplicationSavings: 0, // Would need to implement
      removedFilesSize: dbStats.removedFilesSize || 0,
      versionHistorySize: dbStats.versionHistorySize || 0,
    };
  }
}