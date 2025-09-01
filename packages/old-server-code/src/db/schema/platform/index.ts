/**
 * Platform Schema V2 - Main Exports
 * Clean, modular implementation with no legacy support
 */

// Core tables
export * from "./core";

// Associations
export * from "./associations";

// Lists and segments
export * from "./lists";

// Pipelines and stages
export * from "./pipelines";

// Audit and history
export * from "./audit";

// Enums shared across modules
export * from "./enums";

// Type exports for better DX
export type * from "./types";