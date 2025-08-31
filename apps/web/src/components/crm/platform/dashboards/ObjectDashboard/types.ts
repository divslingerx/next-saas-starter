/**
 * ObjectDashboard Types
 * Shared types for the dashboard system
 */

export type CrmObjectType = 'contacts' | 'companies' | 'leads' | 'deals' | 'projects' | 'invoices';

export interface FilterCondition {
  field: string;
  operator: 'EQ' | 'NEQ' | 'CONTAINS' | 'GT' | 'LT' | 'IN' | 'BETWEEN';
  value: any;
  values?: any[]; // For IN operator
}

export interface FilterGroup {
  id: string;
  operator: 'AND' | 'OR';
  conditions: FilterCondition[];
  groups?: FilterGroup[]; // Nested groups
}

export interface QuickFilter {
  key: string;
  label: string;
  condition: Record<string, any>;
  count?: number;
}

export interface DashboardConfig {
  objectType: CrmObjectType;
  title: string;
  description?: string;
  primaryFields: string[]; // Fields to show in table by default
  searchFields: string[]; // Fields to search across
  quickFilters: QuickFilter[];
  defaultSort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface StatsCard {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon?: React.ComponentType<any>;
  color?: 'default' | 'success' | 'warning' | 'error';
}

export interface ObjectRecord {
  id: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  customProperties?: Record<string, any>;
  [key: string]: any; // For concrete fields
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface SortingState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DashboardState {
  filters: Record<string, any>;
  quickFilter: string | null;
  search: string;
  sorting: SortingState[];
  pagination: PaginationState;
  columnVisibility: Record<string, boolean>;
}