/**
 * Files Module
 * Main export file for the files module
 */

// Controllers
export { FilesController } from "./controllers/files.controller";

// Services
export { FilesService } from "./services/files.service";

// Repository
export { FilesRepository } from "./repositories/files.repository";

// DTOs
export * from "./dto/files.dto";

// Module initialization
import { FilesController } from "./controllers/files.controller";

export const createFilesModule = () => {
  const controller = new FilesController();
  return controller.router;
};