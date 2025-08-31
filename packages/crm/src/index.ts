/**
 * CRM Package - Customer Relationship Management
 * 
 * This package provides CRM-specific functionality built on top of
 * the platform's flexible object system.
 */

// Deal management
export * from './deals/deal.schema';
export * from './deals/deal.service';

// Pipeline management
export * from './pipelines/pipeline.schema';
export * from './pipelines/pipeline.service';

// Sales activities
export * from './activities/activity.types';

// CRM services
export * from './services/crm.service';
export * from './services/crm-setup.service';