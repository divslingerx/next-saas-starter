/**
 * CRM Schema - Concrete Business Objects
 * 
 * This schema defines concrete tables for core business objects
 * that inherit custom property support from the platform object system.
 * 
 * Each table links to platform_objects via object_id for:
 * - Custom properties (JSONB)
 * - Activity history
 * - File attachments  
 * - Tags and permissions
 */

export * from './contacts';
export * from './companies';
export * from './leads';
export * from './deals';
export * from './projects';
export * from './invoices';
export * from './associations';