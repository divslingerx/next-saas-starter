/**
 * Files Repository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { FilesRepository } from "../repositories/files.repository";
import type { CreateFileDto, CreateDirectoryDto } from "../dto/files.dto";

describe("FilesRepository", () => {
  let repository: FilesRepository;
  const testOrgId = "test-org-123";

  beforeEach(() => {
    repository = new FilesRepository();
  });

  describe("File Operations", () => {
    it("should create and find a file", async () => {
      const createFileDto: CreateFileDto = {
        name: "test-file.txt",
        key: "test-key-123",
        organizationId: testOrgId,
        createdByMembershipId: "member-123",
      };

      const createdFile = await repository.createFile(createFileDto);
      expect(createdFile).toBeDefined();
      expect(createdFile.name).toBe(createFileDto.name);
      expect(createdFile.organizationId).toBe(testOrgId);

      if (createdFile.id) {
        const foundFile = await repository.findFileById(createdFile.id, testOrgId);
        expect(foundFile).toBeDefined();
        expect(foundFile?.id).toBe(createdFile.id);
      }
    });

    it("should update a file", async () => {
      const createFileDto: CreateFileDto = {
        name: "test-file.txt",
        key: "test-key-123",
        organizationId: testOrgId,
        createdByMembershipId: "member-123",
      };

      const createdFile = await repository.createFile(createFileDto);
      
      if (createdFile.id) {
        const updatedFile = await repository.updateFile(createdFile.id, testOrgId, {
          name: "updated-file.txt",
        });

        expect(updatedFile).toBeDefined();
        expect(updatedFile?.name).toBe("updated-file.txt");
      }
    });

    it("should soft delete a file", async () => {
      const createFileDto: CreateFileDto = {
        name: "test-file.txt",
        key: "test-key-123",
        organizationId: testOrgId,
        createdByMembershipId: "member-123",
      };

      const createdFile = await repository.createFile(createFileDto);
      
      if (createdFile.id) {
        const deleted = await repository.softDeleteFile(createdFile.id, testOrgId, "member-456");
        expect(deleted).toBe(true);

        const foundFile = await repository.findFileById(createdFile.id, testOrgId);
        expect(foundFile?.isRemoved).toBe(true);
        expect(foundFile?.removedByMembershipId).toBe("member-456");
      }
    });

    it("should restore a soft-deleted file", async () => {
      const createFileDto: CreateFileDto = {
        name: "test-file.txt",
        key: "test-key-123",
        organizationId: testOrgId,
        createdByMembershipId: "member-123",
      };

      const createdFile = await repository.createFile(createFileDto);
      
      if (createdFile.id) {
        // First delete
        await repository.softDeleteFile(createdFile.id, testOrgId, "member-456");
        
        // Then restore
        const restored = await repository.restoreFile(createdFile.id, testOrgId);
        expect(restored).toBe(true);

        const foundFile = await repository.findFileById(createdFile.id, testOrgId);
        expect(foundFile?.isRemoved).toBe(false);
        expect(foundFile?.removedAt).toBeNull();
      }
    });
  });

  describe("Directory Operations", () => {
    it("should create and find a directory", async () => {
      const createDirectoryDto: CreateDirectoryDto = {
        name: "test-directory",
        organizationId: testOrgId,
        createdByMembershipId: "member-123",
      };

      const createdDirectory = await repository.createDirectory(createDirectoryDto);
      expect(createdDirectory).toBeDefined();
      expect(createdDirectory.name).toBe(createDirectoryDto.name);
      expect(createdDirectory.organizationId).toBe(testOrgId);

      if (createdDirectory.id) {
        const foundDirectory = await repository.findDirectoryById(createdDirectory.id, testOrgId);
        expect(foundDirectory).toBeDefined();
        expect(foundDirectory?.id).toBe(createdDirectory.id);
      }
    });

    it("should get directory with contents", async () => {
      // Create parent directory
      const parentDir = await repository.createDirectory({
        name: "parent-dir",
        organizationId: testOrgId,
        createdByMembershipId: "member-123",
      });

      if (parentDir.id) {
        // Create child directory
        await repository.createDirectory({
          name: "child-dir",
          organizationId: testOrgId,
          createdByMembershipId: "member-123",
          parentId: parentDir.id,
        });

        // Create file in parent directory
        await repository.createFile({
          name: "test-file.txt",
          key: "test-key-123",
          organizationId: testOrgId,
          directoryId: parentDir.id,
          createdByMembershipId: "member-123",
        });

        const directoryWithContents = await repository.findDirectoryWithContents(parentDir.id, testOrgId);
        expect(directoryWithContents).toBeDefined();
        expect(directoryWithContents?.files).toHaveLength(1);
        expect(directoryWithContents?.children).toHaveLength(1);
      }
    });
  });

  describe("Search Operations", () => {
    it("should search files by name", async () => {
      // Create test files
      await repository.createFile({
        name: "document.pdf",
        key: "doc-key-1",
        organizationId: testOrgId,
        createdByMembershipId: "member-123",
      });

      await repository.createFile({
        name: "image.png",
        key: "img-key-1",
        organizationId: testOrgId,
        createdByMembershipId: "member-123",
      });

      const searchResults = await repository.searchFiles({
        query: "document",
      }, testOrgId);

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].name).toContain("document");
    });
  });

  describe("Statistics", () => {
    it("should get file stats", async () => {
      // Create some test data
      await repository.createFile({
        name: "test1.txt",
        key: "key1",
        organizationId: testOrgId,
        createdByMembershipId: "member-123",
        totalSize: 100,
      });

      await repository.createFile({
        name: "test2.txt",
        key: "key2",
        organizationId: testOrgId,
        createdByMembershipId: "member-123",
        totalSize: 200,
      });

      const stats = await repository.getFileStats(testOrgId);
      expect(stats).toBeDefined();
      expect(stats.totalFiles).toBeGreaterThanOrEqual(2);
      expect(stats.totalSize).toBeGreaterThanOrEqual(300);
    });
  });
});