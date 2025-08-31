/**
 * Email Package - Centralized email infrastructure
 * Handles all email sending across the platform
 */

export * from './email.service';
export * from './types';
export * from './providers';

// Re-export template components for use in other packages
export * from './templates';