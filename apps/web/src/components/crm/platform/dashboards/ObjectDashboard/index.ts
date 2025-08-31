/**
 * ObjectDashboard Compound Component
 * Flexible dashboard architecture for all CRM object types
 */

export { ObjectDashboardRoot as Root } from './ObjectDashboardRoot';
export { ObjectDashboardHeader as Header } from './ObjectDashboardHeader';
export { ObjectDashboardStatsCards as StatsCards } from './ObjectDashboardStatsCards';
export { ObjectDashboardFilters as Filters } from './ObjectDashboardFilters';
export { ObjectDashboardTable as Table } from './ObjectDashboardTable';

// Quick filter components
export { QuickFilterAll } from './filters/QuickFilterAll';
export { QuickFilterMy } from './filters/QuickFilterMy';
export { QuickFilterUnassigned } from './filters/QuickFilterUnassigned';

// Re-export types
export * from './types';