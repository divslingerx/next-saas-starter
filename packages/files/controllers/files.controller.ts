/**
 * Files Controller
 * Handles HTTP requests for file and directory management operations
 */

import { Hono } from "hono";
import { FilesService } from "../services/files.service";
import type { AppContext } from "@/core/types/hono";
import type {
  CreateDirectoryDto,
  UpdateDirectoryDto,
  FileSearchDto,
  FileMoveDto,
  DirectoryMoveDto,
  BulkFileOperationDto,
  FileUploadDto,
} from "../dto/files.dto";
import { handleError } from "@/core/exceptions/error-handler";
import { ValidationException } from "@/core/exceptions/base.exception";

export class FilesController {
  private service: FilesService;
  public router: Hono;

  constructor() {
    this.service = new FilesService();
    this.router = new Hono();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // File routes
    this.router.get("/files", async (c: AppContext) => {
      try {
        const organizationId = c.get("organizationId");
        const includeRemoved = c.req.query("includeRemoved") === "true";

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        const files = await this.service.getFiles(organizationId, includeRemoved);

        return c.json({
          success: true,
          data: files,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.get("/files/:id", async (c: AppContext) => {
      try {
        const id = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");
        const includeVersions = c.req.query("includeVersions") === "true";

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(id)) {
          throw new ValidationException("Invalid file ID");
        }

        const file = includeVersions
          ? await this.service.getFileWithVersions(id, organizationId)
          : await this.service.getFileById(id, organizationId);

        if (!file) {
          return c.json({ success: false, message: "File not found" }, 404);
        }

        return c.json({
          success: true,
          data: file,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.get("/files/:id/download", async (c: AppContext) => {
      try {
        const id = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");
        const versionId = c.req.query("versionId") ? parseInt(c.req.query("versionId")!) : undefined;

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(id)) {
          throw new ValidationException("Invalid file ID");
        }

        const downloadUrl = await this.service.getFileDownloadUrl(id, organizationId, versionId);

        return c.json({
          success: true,
          data: { downloadUrl },
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.post("/files/search", async (c: AppContext) => {
      try {
        const organizationId = c.get("organizationId");
        const searchDto = await c.req.json<FileSearchDto>();

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        const files = await this.service.searchFiles(searchDto, organizationId);

        return c.json({
          success: true,
          data: files,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.post("/files/upload", async (c: AppContext) => {
      try {
        const organizationId = c.get("organizationId");
        const createdByMembershipId = c.get("membershipId");

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        // In a real implementation, you'd handle multipart/form-data
        // This is a simplified version expecting JSON with base64 content
        const uploadDto = await c.req.json<FileUploadDto & { content: string }>();
        
        if (!uploadDto.content) {
          throw new ValidationException("File content is required");
        }

        // Convert base64 to buffer
        const content = Buffer.from(uploadDto.content, 'base64');
        
        const fileUploadDto: FileUploadDto = {
          ...uploadDto,
          content,
          size: content.length,
        };

        const file = await this.service.uploadFile(fileUploadDto, organizationId, createdByMembershipId);

        return c.json({
          success: true,
          data: file,
          message: "File uploaded successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.patch("/files/:id", async (c: AppContext) => {
      try {
        const id = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");
        const updateDto = await c.req.json();

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(id)) {
          throw new ValidationException("Invalid file ID");
        }

        const file = await this.service.updateFile(id, updateDto, organizationId);

        if (!file) {
          return c.json({ success: false, message: "File not found" }, 404);
        }

        return c.json({
          success: true,
          data: file,
          message: "File updated successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.post("/files/:id/move", async (c: AppContext) => {
      try {
        const id = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");
        const { targetDirectoryId } = await c.req.json<{ targetDirectoryId?: number }>();

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(id)) {
          throw new ValidationException("Invalid file ID");
        }

        const moveDto: FileMoveDto = {
          fileId: id,
          targetDirectoryId,
        };

        const success = await this.service.moveFile(moveDto, organizationId);

        if (!success) {
          return c.json({ success: false, message: "Failed to move file" }, 400);
        }

        return c.json({
          success: true,
          message: "File moved successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.delete("/files/:id", async (c: AppContext) => {
      try {
        const id = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");
        const removedByMembershipId = c.get("membershipId");

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(id)) {
          throw new ValidationException("Invalid file ID");
        }

        const success = await this.service.deleteFile(id, organizationId, removedByMembershipId);

        if (!success) {
          return c.json({ success: false, message: "File not found" }, 404);
        }

        return c.json({
          success: true,
          message: "File deleted successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.post("/files/:id/restore", async (c: AppContext) => {
      try {
        const id = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(id)) {
          throw new ValidationException("Invalid file ID");
        }

        const success = await this.service.restoreFile(id, organizationId);

        if (!success) {
          return c.json({ success: false, message: "File not found or not deleted" }, 404);
        }

        return c.json({
          success: true,
          message: "File restored successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Directory routes
    this.router.get("/directories", async (c: AppContext) => {
      try {
        const organizationId = c.get("organizationId");
        const includeRemoved = c.req.query("includeRemoved") === "true";

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        const directories = await this.service.getDirectories(organizationId, includeRemoved);

        return c.json({
          success: true,
          data: directories,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.get("/directories/:id", async (c: AppContext) => {
      try {
        const id = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");
        const includeContents = c.req.query("includeContents") === "true";

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(id)) {
          throw new ValidationException("Invalid directory ID");
        }

        const directory = includeContents
          ? await this.service.getDirectoryWithContents(id, organizationId)
          : { ...(await this.service.getDirectories(organizationId)).find(d => d.id === id) };

        if (!directory) {
          return c.json({ success: false, message: "Directory not found" }, 404);
        }

        return c.json({
          success: true,
          data: directory,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.post("/directories", async (c: AppContext) => {
      try {
        const organizationId = c.get("organizationId");
        const createdByMembershipId = c.get("membershipId");
        const createDto = await c.req.json<CreateDirectoryDto>();

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (!createDto.name) {
          throw new ValidationException("Directory name is required");
        }

        const directory = await this.service.createDirectory(createDto, organizationId, createdByMembershipId);

        return c.json({
          success: true,
          data: directory,
          message: "Directory created successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.patch("/directories/:id", async (c: AppContext) => {
      try {
        const id = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");
        const updateDto = await c.req.json<UpdateDirectoryDto>();

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(id)) {
          throw new ValidationException("Invalid directory ID");
        }

        const directory = await this.service.updateDirectory(id, updateDto, organizationId);

        if (!directory) {
          return c.json({ success: false, message: "Directory not found" }, 404);
        }

        return c.json({
          success: true,
          data: directory,
          message: "Directory updated successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.post("/directories/:id/move", async (c: AppContext) => {
      try {
        const id = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");
        const { parentId } = await c.req.json<{ parentId?: number }>();

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(id)) {
          throw new ValidationException("Invalid directory ID");
        }

        const moveDto: DirectoryMoveDto = {
          directoryId: id,
          parentId,
        };

        const success = await this.service.moveDirectory(moveDto, organizationId);

        if (!success) {
          return c.json({ success: false, message: "Failed to move directory" }, 400);
        }

        return c.json({
          success: true,
          message: "Directory moved successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.delete("/directories/:id", async (c: AppContext) => {
      try {
        const id = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");
        const removedByMembershipId = c.get("membershipId");

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(id)) {
          throw new ValidationException("Invalid directory ID");
        }

        const success = await this.service.deleteDirectory(id, organizationId, removedByMembershipId);

        if (!success) {
          return c.json({ success: false, message: "Directory not found" }, 404);
        }

        return c.json({
          success: true,
          message: "Directory deleted successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Bulk operations
    this.router.post("/files/bulk", async (c: AppContext) => {
      try {
        const organizationId = c.get("organizationId");
        const membershipId = c.get("membershipId");
        const operationDto = await c.req.json<BulkFileOperationDto>();

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (!operationDto.fileIds || operationDto.fileIds.length === 0) {
          throw new ValidationException("File IDs are required");
        }

        const result = await this.service.bulkFileOperation(operationDto, organizationId, membershipId);

        return c.json({
          success: true,
          data: result,
          message: `Bulk operation completed: ${result.success} succeeded, ${result.failed} failed`,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // File versions
    this.router.post("/files/:id/versions", async (c: AppContext) => {
      try {
        const fileId = parseInt(c.req.param("id"));
        const organizationId = c.get("organizationId");
        const createdByMembershipId = c.get("membershipId");
        const versionDto = await c.req.json();

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(fileId)) {
          throw new ValidationException("Invalid file ID");
        }

        versionDto.createdByMembershipId = createdByMembershipId;

        const version = await this.service.createFileVersion(fileId, versionDto, organizationId);

        return c.json({
          success: true,
          data: version,
          message: "File version created successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    this.router.post("/files/:fileId/versions/:versionId/set-current", async (c: AppContext) => {
      try {
        const fileId = parseInt(c.req.param("fileId"));
        const versionId = parseInt(c.req.param("versionId"));
        const organizationId = c.get("organizationId");

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        if (isNaN(fileId) || isNaN(versionId)) {
          throw new ValidationException("Invalid file or version ID");
        }

        const success = await this.service.setCurrentVersion(fileId, versionId, organizationId);

        if (!success) {
          return c.json({ success: false, message: "Failed to set current version" }, 400);
        }

        return c.json({
          success: true,
          message: "Current version updated successfully",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Statistics
    this.router.get("/stats", async (c: AppContext) => {
      try {
        const organizationId = c.get("organizationId");

        if (!organizationId) {
          throw new ValidationException("Organization ID is required");
        }

        const stats = await this.service.getFileStats(organizationId);

        return c.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Cleanup
    this.router.post("/cleanup", async (c: AppContext) => {
      try {
        const cleanup = await this.service.cleanupEligibleFiles();

        return c.json({
          success: true,
          data: cleanup,
          message: "Cleanup analysis completed",
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Health check
    this.router.get("/health", (c) => {
      return c.json({
        success: true,
        message: "Files module is healthy",
        timestamp: new Date().toISOString(),
      });
    });
  }
}