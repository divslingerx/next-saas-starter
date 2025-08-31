/**
 * Table utility functions
 * Extracted from CRM example for data table operations
 */

import type { Row, SortingState, ColumnFiltersState } from "@tanstack/react-table";

/**
 * Export table data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string = 'export.csv',
  columns?: string[]
) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object or use provided columns
  const headers = columns || Object.keys(data[0]);
  
  // Build CSV content
  const csvContent = [
    // Headers
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or newline
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get visible columns data for export
 */
export function getExportData<T>(
  rows: Row<T>[],
  visibleColumns: string[]
): Record<string, any>[] {
  return rows.map(row => {
    const rowData: Record<string, any> = {};
    visibleColumns.forEach(columnId => {
      rowData[columnId] = row.getValue(columnId);
    });
    return rowData;
  });
}

/**
 * Parse filter value based on type
 */
export function parseFilterValue(value: string, type: string): any {
  switch (type) {
    case 'number':
      return Number(value);
    case 'boolean':
      return value === 'true';
    case 'date':
      return new Date(value);
    default:
      return value;
  }
}

/**
 * Format cell value for display
 */
export function formatCellValue(value: any, type?: string): string {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'datetime':
      return new Date(value).toLocaleString();
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    case 'percent':
      return `${value}%`;
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
}

/**
 * Get unique values from column for filter options
 */
export function getUniqueColumnValues<T>(
  data: T[],
  accessor: keyof T | ((item: T) => any)
): Array<{ label: string; value: any }> {
  const values = new Set<any>();
  
  data.forEach(item => {
    const value = typeof accessor === 'function' 
      ? accessor(item) 
      : item[accessor];
    
    if (value !== null && value !== undefined) {
      values.add(value);
    }
  });
  
  return Array.from(values)
    .sort()
    .map(value => ({
      label: formatCellValue(value),
      value
    }));
}

/**
 * Build query string from table state
 */
export function buildTableQueryString(params: {
  sorting?: SortingState;
  filters?: ColumnFiltersState;
  pagination?: { pageIndex: number; pageSize: number };
}): string {
  const queryParams = new URLSearchParams();
  
  // Add sorting
  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0];
    queryParams.set('sortBy', sort.id);
    queryParams.set('sortOrder', sort.desc ? 'desc' : 'asc');
  }
  
  // Add filters
  if (params.filters) {
    params.filters.forEach(filter => {
      queryParams.set(`filter_${filter.id}`, String(filter.value));
    });
  }
  
  // Add pagination
  if (params.pagination) {
    queryParams.set('page', String(params.pagination.pageIndex + 1));
    queryParams.set('limit', String(params.pagination.pageSize));
  }
  
  return queryParams.toString();
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}