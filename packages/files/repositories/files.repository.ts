/**
 * Files Repository
 * Database operations for file and directory management
 */

import { BaseRepository } from "@/core/base/base.repository";
import { db } from "@/db";
import { files, directories, fileVersion } from "@/db/schema/files/files";
import { and, eq, isNull, or, ilike, gte, lte, desc, asc, sql, count, sum } from "drizzle-orm";
import type {
  FileDto,
  DirectoryDto,
  FileVersionDto,
  CreateFileDto,
  UpdateFileDto,
  CreateDirectoryDto,
  UpdateDirectoryDto,
  CreateFileVersionDto,
  UpdateFileVersionDto,
  FileWithVersionsDto,
  DirectoryWithContentsDto,
  FileSearchDto,
  DirectoryTreeDto,
  FileStatsDto,
  StorageStatsDto,
  FileCleanupDto,
} from "../dto/files.dto";

export class FilesRepository extends BaseRepository<FileDto, CreateFileDto, UpdateFileDto> {
  constructor() {
    super(files, db);
  }

  async findFilesByOrganization(
    organizationId: string,
    includeRemoved: boolean = false
  ): Promise<FileDto[]> {
    const whereClause = includeRemoved
      ? eq(files.organizationId, organizationId)
      : and(eq(files.organizationId, organizationId), eq(files.isRemoved, false));

    return await db
      .select()
      .from(files)
      .where(whereClause)
      .orderBy(desc(files.createdAt));
  }

  async findFileById(id: number, organizationId: string): Promise<FileDto | null> {
    const [result] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.organizationId, organizationId)));

    return result || null;
  }

  async findFileWithVersions(id: number, organizationId: string): Promise<FileWithVersionsDto | null> {
    const [result] = await db
      .select({
        file: files,
        currentVersion: fileVersion,
        directory: directories,
      })
      .from(files)
      .leftJoin(fileVersion, eq(files.currentVersionId, fileVersion.id))
      .leftJoin(directories, eq(files.directoryId, directories.id))
      .where(and(eq(files.id, id), eq(files.organizationId, organizationId)));

    if (!result) return null;

    const versions = await db
      .select()
      .from(fileVersion)
      .where(eq(fileVersion.fileId, id))
      .orderBy(desc(fileVersion.version));

    return {
      ...result.file,
      versions,
      currentVersion: result.currentVersion,
      directory: result.directory,
    };
  }

  async searchFiles(searchDto: FileSearchDto, organizationId: string): Promise<FileDto[]> {
    const conditions = [eq(files.organizationId, organizationId)];

    if (!searchDto.includeRemoved) {
      conditions.push(eq(files.isRemoved, false));
    }

    if (searchDto.query) {
      conditions.push(ilike(files.name, `%${searchDto.query}%`));
    }

    if (searchDto.directoryId) {
      conditions.push(eq(files.directoryId, searchDto.directoryId));
    }

    if (searchDto.createdAfter) {
      conditions.push(gte(files.createdAt, searchDto.createdAfter));
    }

    if (searchDto.createdBefore) {
      conditions.push(lte(files.createdAt, searchDto.createdBefore));
    }

    return await db
      .select()
      .from(files)
      .where(and(...conditions))
      .orderBy(desc(files.createdAt));
  }

  async createFile(fileDto: CreateFileDto): Promise<FileDto> {
    const [result] = await db.insert(files).values(fileDto).returning();
    if (!result) {
      throw new Error('Failed to create file');
    }
    return result;
  }

  async updateFile(id: number, organizationId: string, updateDto: UpdateFileDto): Promise<FileDto | null> {
    const [result] = await db
      .update(files)
      .set({ ...updateDto, updatedAt: new Date() })
      .where(and(eq(files.id, id), eq(files.organizationId, organizationId)))
      .returning();

    return result || null;
  }

  async softDeleteFile(id: number, organizationId: string, removedByMembershipId?: string): Promise<boolean> {
    const now = new Date();
    const hardDeleteEligibleAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const [result] = await db
      .update(files)
      .set({
        isRemoved: true,
        removedAt: now,
        removedByMembershipId,
        hardDeleteEligibleAt,
        updatedAt: now,
      })
      .where(and(eq(files.id, id), eq(files.organizationId, organizationId)))
      .returning();

    return !!result;
  }

  async restoreFile(id: number, organizationId: string): Promise<boolean> {
    const [result] = await db
      .update(files)
      .set({
        isRemoved: false,
        removedAt: null,
        removedByMembershipId: null,
        hardDeleteEligibleAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(files.id, id), eq(files.organizationId, organizationId)))
      .returning();

    return !!result;
  }

  async moveFile(id: number, organizationId: string, targetDirectoryId?: number): Promise<boolean> {
    const [result] = await db
      .update(files)
      .set({
        directoryId: targetDirectoryId,
        updatedAt: new Date(),
      })
      .where(and(eq(files.id, id), eq(files.organizationId, organizationId)))
      .returning();

    return !!result;
  }

  // Directory methods
  async findDirectoriesByOrganization(
    organizationId: string,
    includeRemoved: boolean = false
  ): Promise<DirectoryDto[]> {
    const whereClause = includeRemoved
      ? eq(directories.organizationId, organizationId)
      : and(eq(directories.organizationId, organizationId), eq(directories.isRemoved, false));

    return await db
      .select()
      .from(directories)
      .where(whereClause)
      .orderBy(asc(directories.path), asc(directories.name));
  }

  async findDirectoryById(id: number, organizationId: string): Promise<DirectoryDto | null> {
    const [result] = await db
      .select()
      .from(directories)
      .where(and(eq(directories.id, id), eq(directories.organizationId, organizationId)));

    return result || null;
  }

  async findDirectoryWithContents(id: number, organizationId: string): Promise<DirectoryWithContentsDto | null> {
    const directory = await this.findDirectoryById(id, organizationId);
    if (!directory) return null;

    const directoryFiles = await db
      .select()
      .from(files)
      .where(and(eq(files.directoryId, id), eq(files.organizationId, organizationId), eq(files.isRemoved, false)))
      .orderBy(asc(files.name));

    const children = await db
      .select()
      .from(directories)
      .where(and(eq(directories.parentId, id), eq(directories.organizationId, organizationId), eq(directories.isRemoved, false)))
      .orderBy(asc(directories.name));

    const parent = directory.parentId
      ? await this.findDirectoryById(directory.parentId, organizationId)
      : null;

    return {
      ...directory,
      files: directoryFiles,
      children,
      parent,
    };
  }

  async createDirectory(directoryDto: CreateDirectoryDto): Promise<DirectoryDto> {
    const [result] = await db.insert(directories).values(directoryDto).returning();
    if (!result) {
      throw new Error('Failed to create directory');
    }
    return result;
  }

  async updateDirectory(id: number, organizationId: string, updateDto: UpdateDirectoryDto): Promise<DirectoryDto | null> {
    const [result] = await db
      .update(directories)
      .set({ ...updateDto, updatedAt: new Date() })
      .where(and(eq(directories.id, id), eq(directories.organizationId, organizationId)))
      .returning();

    return result || null;
  }

  async softDeleteDirectory(id: number, organizationId: string, removedByMembershipId?: string): Promise<boolean> {
    const now = new Date();
    const hardDeleteEligibleAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const [result] = await db
      .update(directories)
      .set({
        isRemoved: true,
        removedAt: now,
        removedByMembershipId,
        hardDeleteEligibleAt,
        updatedAt: now,
      })
      .where(and(eq(directories.id, id), eq(directories.organizationId, organizationId)))
      .returning();

    return !!result;
  }

  async moveDirectory(id: number, organizationId: string, parentId?: number): Promise<boolean> {
    const [result] = await db
      .update(directories)
      .set({
        parentId,
        updatedAt: new Date(),
      })
      .where(and(eq(directories.id, id), eq(directories.organizationId, organizationId)))
      .returning();

    return !!result;
  }

  // File Version methods
  async createFileVersion(versionDto: CreateFileVersionDto): Promise<FileVersionDto> {
    const [result] = await db.insert(fileVersion).values(versionDto).returning();
    if (!result) {
      throw new Error('Failed to create file version');
    }
    return result;
  }

  async findFileVersions(fileId: number, organizationId: string): Promise<FileVersionDto[]> {
    return await db
      .select()
      .from(fileVersion)
      .where(and(eq(fileVersion.fileId, fileId), eq(fileVersion.organizationId, organizationId)))
      .orderBy(desc(fileVersion.version));
  }

  async setCurrentVersion(fileId: number, versionId: number, organizationId: string): Promise<boolean> {
    // First, unset all latest flags for this file
    await db
      .update(fileVersion)
      .set({ isLatest: false })
      .where(and(eq(fileVersion.fileId, fileId), eq(fileVersion.organizationId, organizationId)));

    // Set the new version as latest
    await db
      .update(fileVersion)
      .set({ isLatest: true })
      .where(and(eq(fileVersion.id, versionId), eq(fileVersion.organizationId, organizationId)));

    // Update the file's current version reference
    const [result] = await db
      .update(files)
      .set({ 
        currentVersionId: versionId,
        updatedAt: new Date(),
      })
      .where(and(eq(files.id, fileId), eq(files.organizationId, organizationId)))
      .returning();

    return !!result;
  }

  // Statistics methods
  async getFileStats(organizationId: string): Promise<FileStatsDto> {
    const totalFilesResult = await db
      .select({ count: count() })
      .from(files)
      .where(and(eq(files.organizationId, organizationId), eq(files.isRemoved, false)));

    const totalDirectoriesResult = await db
      .select({ count: count() })
      .from(directories)
      .where(and(eq(directories.organizationId, organizationId), eq(directories.isRemoved, false)));

    const totalSizeResult = await db
      .select({ size: sum(files.totalSize) })
      .from(files)
      .where(and(eq(files.organizationId, organizationId), eq(files.isRemoved, false)));

    const removedFilesResult = await db
      .select({ count: count() })
      .from(files)
      .where(and(eq(files.organizationId, organizationId), eq(files.isRemoved, true)));

    const removedDirectoriesResult = await db
      .select({ count: count() })
      .from(directories)
      .where(and(eq(directories.organizationId, organizationId), eq(directories.isRemoved, true)));

    return {
      totalFiles: totalFilesResult[0]?.count || 0,
      totalDirectories: totalDirectoriesResult[0]?.count || 0,
      totalSize: Number(totalSizeResult[0]?.size) || 0,
      removedFiles: removedFilesResult[0]?.count || 0,
      removedDirectories: removedDirectoriesResult[0]?.count || 0,
      filesByMimeType: {},
      sizeByMimeType: {},
    };
  }

  async findFilesEligibleForHardDelete(): Promise<FileDto[]> {
    return await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.isRemoved, true),
          lte(files.hardDeleteEligibleAt!, new Date())
        )
      );
  }

  async findDirectoriesEligibleForHardDelete(): Promise<DirectoryDto[]> {
    return await db
      .select()
      .from(directories)
      .where(
        and(
          eq(directories.isRemoved, true),
          lte(directories.hardDeleteEligibleAt!, new Date())
        )
      );
  }

  async hardDeleteFile(id: number, organizationId?: string): Promise<boolean> {
    const whereConditions = organizationId 
      ? and(eq(files.id, id), eq(files.organizationId, organizationId))
      : eq(files.id, id);

    const [result] = await db
      .delete(files)
      .where(whereConditions)
      .returning();

    return !!result;
  }

  async hardDeleteDirectory(id: number): Promise<boolean> {
    const [result] = await db
      .delete(directories)
      .where(eq(directories.id, id))
      .returning();

    return !!result;
  }

  async findFileVersionById(id: number, organizationId: string): Promise<FileVersionDto | null> {
    const [result] = await db
      .select()
      .from(fileVersion)
      .where(and(eq(fileVersion.id, id), eq(fileVersion.organizationId, organizationId)));

    return result || null;
  }


  async getStorageStats(organizationId: string): Promise<{
    removedFilesSize: number;
    versionHistorySize: number;
  }> {
    // Get removed files size
    const [removedResult] = await db
      .select({
        totalSize: sum(files.totalSize).as('totalSize')
      })
      .from(files)
      .where(
        and(
          eq(files.organizationId, organizationId),
          eq(files.isRemoved, true)
        )
      );

    // Get version history size (non-latest versions)
    const [versionResult] = await db
      .select({
        totalSize: sum(fileVersion.size).as('totalSize')
      })
      .from(fileVersion)
      .where(
        and(
          eq(fileVersion.organizationId, organizationId),
          eq(fileVersion.isLatest, false)
        )
      );

    return {
      removedFilesSize: Number(removedResult?.totalSize) || 0,
      versionHistorySize: Number(versionResult?.totalSize) || 0,
    };
  }
}