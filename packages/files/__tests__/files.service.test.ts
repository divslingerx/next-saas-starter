/**
 * Files Service Tests
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { FilesService } from "../services/files.service";
import { FilesRepository } from "../repositories/files.repository";
import { ValidationException } from "@/core/exceptions/base.exception";
import type { FileUploadDto, CreateDirectoryDto } from "../dto/files.dto";

// Mock the repository
const mockRepository = {
  findFilesByOrganization: mock(() => Promise.resolve([])),
  findFileById: mock(() => Promise.resolve(null)),
  findFileWithVersions: mock(() => Promise.resolve(null)),
  searchFiles: mock(() => Promise.resolve([])),
  createFile: mock(() => Promise.resolve({ id: 1, name: "test.txt", organizationId: "test-org" })),
  createFileVersion: mock(() => Promise.resolve({ id: 1, version: 1, fileId: 1 })),
  updateFile: mock(() => Promise.resolve({ id: 1, name: "updated.txt", organizationId: "test-org" })),
  moveFile: mock(() => Promise.resolve(true)),
  softDeleteFile: mock(() => Promise.resolve(true)),
  restoreFile: mock(() => Promise.resolve(true)),
  findDirectoriesByOrganization: mock(() => Promise.resolve([])),
  findDirectoryById: mock(() => Promise.resolve({ id: 1, name: "test-dir", organizationId: "test-org" })),
  findDirectoryWithContents: mock(() => Promise.resolve(null)),
  createDirectory: mock(() => Promise.resolve({ id: 1, name: "test-dir", organizationId: "test-org" })),
  updateDirectory: mock(() => Promise.resolve({ id: 1, name: "updated-dir", organizationId: "test-org" })),
  moveDirectory: mock(() => Promise.resolve(true)),
  softDeleteDirectory: mock(() => Promise.resolve(true)),
  findFileVersions: mock(() => Promise.resolve([])),
  setCurrentVersion: mock(() => Promise.resolve(true)),
  getFileStats: mock(() => Promise.resolve({
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    removedFiles: 0,
    removedDirectories: 0,
    filesByMimeType: {},
    sizeByMimeType: {},
  })),
};

describe("FilesService", () => {
  let service: FilesService;
  const testOrgId = "test-org-123";
  const testMemberId = "member-123";

  beforeEach(() => {
    service = new FilesService();
    // Replace the repository with our mock
    (service as any).repository = mockRepository;
    
    // Reset all mocks
    Object.values(mockRepository).forEach(mockFn => mockFn.mockClear());
  });

  describe("File Operations", () => {
    it("should get files for organization", async () => {
      const mockFiles = [
        { id: 1, name: "file1.txt", organizationId: testOrgId },
        { id: 2, name: "file2.txt", organizationId: testOrgId },
      ];
      mockRepository.findFilesByOrganization.mockResolvedValue(mockFiles);

      const result = await service.getFiles(testOrgId);

      expect(mockRepository.findFilesByOrganization).toHaveBeenCalledWith(testOrgId, false);
      expect(result).toEqual(mockFiles);
    });

    it("should get file by id", async () => {
      const mockFile = { id: 1, name: "test.txt", organizationId: testOrgId };
      mockRepository.findFileById.mockResolvedValue(mockFile);

      const result = await service.getFileById(1, testOrgId);

      expect(mockRepository.findFileById).toHaveBeenCalledWith(1, testOrgId);
      expect(result).toEqual(mockFile);
    });

    it("should upload a file", async () => {
      const uploadDto: FileUploadDto = {
        name: "test.txt",
        mimeType: "text/plain",
        size: 100,
        content: Buffer.from("test content"),
        metadata: { source: "upload" },
      };

      const mockCreatedFile = { id: 1, name: "test.txt", organizationId: testOrgId };
      const mockCreatedVersion = { id: 1, version: 1, fileId: 1 };
      const mockFileWithVersions = {
        ...mockCreatedFile,
        versions: [mockCreatedVersion],
        currentVersion: mockCreatedVersion,
        directory: null,
      };

      mockRepository.createFile.mockResolvedValue(mockCreatedFile);
      mockRepository.createFileVersion.mockResolvedValue(mockCreatedVersion);
      mockRepository.updateFile.mockResolvedValue(mockCreatedFile);
      mockRepository.findFileWithVersions.mockResolvedValue(mockFileWithVersions);

      const result = await service.uploadFile(uploadDto, testOrgId, testMemberId);

      expect(mockRepository.createFile).toHaveBeenCalled();
      expect(mockRepository.createFileVersion).toHaveBeenCalled();
      expect(result).toEqual(mockFileWithVersions);
    });

    it("should validate directory exists when uploading to specific directory", async () => {
      const uploadDto: FileUploadDto = {
        name: "test.txt",
        mimeType: "text/plain",
        size: 100,
        content: Buffer.from("test content"),
        directoryId: 999, // Non-existent directory
      };

      mockRepository.findDirectoryById.mockResolvedValue(null);

      await expect(service.uploadFile(uploadDto, testOrgId, testMemberId)).rejects.toThrow(ValidationException);
      expect(mockRepository.findDirectoryById).toHaveBeenCalledWith(999, testOrgId);
    });

    it("should move a file", async () => {
      const targetDirectoryId = 2;
      mockRepository.findDirectoryById.mockResolvedValue({ id: targetDirectoryId, name: "target-dir" });
      mockRepository.moveFile.mockResolvedValue(true);

      const result = await service.moveFile({ fileId: 1, targetDirectoryId }, testOrgId);

      expect(mockRepository.findDirectoryById).toHaveBeenCalledWith(targetDirectoryId, testOrgId);
      expect(mockRepository.moveFile).toHaveBeenCalledWith(1, testOrgId, targetDirectoryId);
      expect(result).toBe(true);
    });

    it("should delete a file", async () => {
      mockRepository.softDeleteFile.mockResolvedValue(true);

      const result = await service.deleteFile(1, testOrgId, testMemberId);

      expect(mockRepository.softDeleteFile).toHaveBeenCalledWith(1, testOrgId, testMemberId);
      expect(result).toBe(true);
    });

    it("should restore a file", async () => {
      mockRepository.restoreFile.mockResolvedValue(true);

      const result = await service.restoreFile(1, testOrgId);

      expect(mockRepository.restoreFile).toHaveBeenCalledWith(1, testOrgId);
      expect(result).toBe(true);
    });
  });

  describe("Directory Operations", () => {
    it("should create a directory", async () => {
      const createDto: CreateDirectoryDto = {
        name: "new-directory",
        organizationId: testOrgId,
      };

      const mockCreatedDirectory = {
        id: 1,
        name: "new-directory",
        organizationId: testOrgId,
        depth: 0,
        path: "new-directory",
      };

      mockRepository.createDirectory.mockResolvedValue(mockCreatedDirectory);

      const result = await service.createDirectory(createDto, testOrgId, testMemberId);

      expect(mockRepository.createDirectory).toHaveBeenCalledWith({
        ...createDto,
        organizationId: testOrgId,
        createdByMembershipId: testMemberId,
        depth: 0,
        path: "new-directory",
      });
      expect(result).toEqual(mockCreatedDirectory);
    });

    it("should create a subdirectory with correct depth and path", async () => {
      const parentDirectory = {
        id: 1,
        name: "parent",
        organizationId: testOrgId,
        depth: 0,
        path: "parent",
      };

      const createDto: CreateDirectoryDto = {
        name: "child",
        organizationId: testOrgId,
        parentId: 1,
      };

      mockRepository.findDirectoryById.mockResolvedValue(parentDirectory);

      await service.createDirectory(createDto, testOrgId, testMemberId);

      expect(mockRepository.createDirectory).toHaveBeenCalledWith({
        ...createDto,
        organizationId: testOrgId,
        createdByMembershipId: testMemberId,
        depth: 1,
        path: "parent/child",
      });
    });

    it("should validate parent directory exists", async () => {
      const createDto: CreateDirectoryDto = {
        name: "child",
        organizationId: testOrgId,
        parentId: 999, // Non-existent parent
      };

      mockRepository.findDirectoryById.mockResolvedValue(null);

      await expect(service.createDirectory(createDto, testOrgId, testMemberId)).rejects.toThrow(ValidationException);
    });

    it("should move a directory", async () => {
      const targetParent = { id: 2, name: "target-parent", organizationId: testOrgId };
      const sourceDirectory = { id: 1, name: "source-dir", organizationId: testOrgId };

      mockRepository.findDirectoryById
        .mockResolvedValueOnce(targetParent) // First call for parent validation
        .mockResolvedValueOnce(sourceDirectory); // Second call for source directory

      mockRepository.moveDirectory.mockResolvedValue(true);

      const result = await service.moveDirectory({ directoryId: 1, parentId: 2 }, testOrgId);

      expect(mockRepository.moveDirectory).toHaveBeenCalledWith(1, testOrgId, 2);
      expect(result).toBe(true);
    });
  });

  describe("Bulk Operations", () => {
    it("should perform bulk file operations", async () => {
      const operationDto = {
        fileIds: [1, 2, 3],
        action: 'remove' as const,
      };

      mockRepository.softDeleteFile.mockResolvedValue(true);

      const result = await service.bulkFileOperation(operationDto, testOrgId, testMemberId);

      expect(mockRepository.softDeleteFile).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: 3, failed: 0 });
    });

    it("should handle failures in bulk operations", async () => {
      const operationDto = {
        fileIds: [1, 2, 3],
        action: 'remove' as const,
      };

      mockRepository.softDeleteFile
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error("Database error"))
        .mockResolvedValueOnce(true);

      const result = await service.bulkFileOperation(operationDto, testOrgId, testMemberId);

      expect(result).toEqual({ success: 2, failed: 1 });
    });
  });

  describe("File Versions", () => {
    it("should create a new file version", async () => {
      const fileId = 1;
      const versionDto = {
        mimeType: "text/plain",
        size: 200,
        contentHash: "hash123",
        storageKey: "storage/key",
        createdByMembershipId: testMemberId,
      };

      const mockFile = { id: fileId, name: "test.txt", organizationId: testOrgId };
      const mockExistingVersions = [{ version: 1 }, { version: 2 }];
      const mockCreatedVersion = { id: 3, version: 3, fileId };

      mockRepository.findFileById.mockResolvedValue(mockFile);
      mockRepository.findFileVersions.mockResolvedValue(mockExistingVersions);
      mockRepository.createFileVersion.mockResolvedValue(mockCreatedVersion);

      const result = await service.createFileVersion(fileId, versionDto, testOrgId);

      expect(mockRepository.createFileVersion).toHaveBeenCalledWith({
        ...versionDto,
        fileId,
        organizationId: testOrgId,
        version: 3, // Should be max existing + 1
        isLatest: false,
      });
      expect(result).toEqual(mockCreatedVersion);
    });

    it("should set current version", async () => {
      mockRepository.setCurrentVersion.mockResolvedValue(true);

      const result = await service.setCurrentVersion(1, 2, testOrgId);

      expect(mockRepository.setCurrentVersion).toHaveBeenCalledWith(1, 2, testOrgId);
      expect(result).toBe(true);
    });
  });

  describe("Statistics", () => {
    it("should get file statistics", async () => {
      const mockStats = {
        totalFiles: 10,
        totalDirectories: 5,
        totalSize: 1000,
        removedFiles: 2,
        removedDirectories: 1,
        filesByMimeType: { "text/plain": 5, "image/png": 3 },
        sizeByMimeType: { "text/plain": 500, "image/png": 300 },
      };

      mockRepository.getFileStats.mockResolvedValue(mockStats);

      const result = await service.getFileStats(testOrgId);

      expect(mockRepository.getFileStats).toHaveBeenCalledWith(testOrgId);
      expect(result).toEqual(mockStats);
    });
  });
});