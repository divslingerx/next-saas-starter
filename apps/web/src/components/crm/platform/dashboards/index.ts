/**
 * Platform Dashboards
 * Export all dashboard components and configurations
 */

// Main compound component
export * as ObjectDashboard from './ObjectDashboard';

// Configurations
export { contactsConfig, contactsColumns, contactsStatsCards } from './configs/contacts';
export { companiesConfig, companiesColumns, companiesStatsCards } from './configs/companies';

// Types
export * from './ObjectDashboard/types';