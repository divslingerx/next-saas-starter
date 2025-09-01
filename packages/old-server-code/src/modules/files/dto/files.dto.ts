/**
 * Files DTOs
 * Data transfer objects for file management operations
 */

import type { 
  FileDto as SchemaFileDto, 
  DirectoryDto as SchemaDirectoryDto, 
  FileVersionDto as SchemaFileVersionDto,
  FileInsertDto,
  DirectoryInsertDto, 
  FileVersionInsertDto
} from "@/db/schema/files/files";

export type FileDto = SchemaFileDto;
export type CreateFileDto = FileInsertDto;
export type UpdateFileDto = Partial<Omit<CreateFileDto, "id" | "organizationId" | "createdAt">>;

export type DirectoryDto = SchemaDirectoryDto;
export type CreateDirectoryDto = DirectoryInsertDto;
export type UpdateDirectoryDto = Partial<Omit<CreateDirectoryDto, "id" | "organizationId" | "createdAt">>;

export type FileVersionDto = SchemaFileVersionDto;
export type CreateFileVersionDto = FileVersionInsertDto;
export type UpdateFileVersionDto = Partial<Omit<CreateFileVersionDto, "id" | "fileId" | "organizationId" | "createdAt">>;

export interface FileWithVersionsDto extends FileDto {
  versions: FileVersionDto[];
  currentVersion: FileVersionDto | null;
  directory: DirectoryDto | null;
}

export interface DirectoryWithContentsDto extends DirectoryDto {
  files: FileDto[];
  children: DirectoryDto[];
  parent: DirectoryDto | null;
}

export interface FileUploadDto {
  name: string;
  mimeType: string;
  size: number;
  content: Buffer;
  directoryId?: number;
  metadata?: Record<string, any>;
}

export interface FileSearchDto {
  query?: string;
  directoryId?: number;
  mimeType?: string;
  minSize?: number;
  maxSize?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  includeRemoved?: boolean;
}

export interface DirectoryTreeDto {
  id: number;
  name: string;
  parentId: number | null;
  path: string | null;
  depth: number;
  fileCount: number;
  size: number;
  children: DirectoryTreeDto[];
  isRemoved: boolean;
}

export interface FileMoveDto {
  fileId: number;
  targetDirectoryId?: number;
}

export interface DirectoryMoveDto {
  directoryId: number;
  parentId?: number;
}

export interface BulkFileOperationDto {
  fileIds: number[];
  action: 'move' | 'remove' | 'restore';
  targetDirectoryId?: number;
}

export interface FileStatsDto {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  removedFiles: number;
  removedDirectories: number;
  filesByMimeType: Record<string, number>;
  sizeByMimeType: Record<string, number>;
}

export interface StorageStatsDto {
  totalUsed: number;
  totalAvailable: number;
  usagePercentage: number;
  deduplicationSavings: number;
  removedFilesSize: number;
  versionHistorySize: number;
}

export interface FileCleanupDto {
  eligibleForHardDelete: number;
  oldVersions: number;
  duplicateFiles: number;
  estimatedSpaceRecoverable: number;
}