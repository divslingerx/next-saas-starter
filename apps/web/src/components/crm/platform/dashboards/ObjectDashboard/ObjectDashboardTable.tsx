/**
 * ObjectDashboardTable
 * Integrates with existing PlatformTable but adds dashboard context
 */

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PlatformTable } from '../../PlatformTable';
import { useDashboardContext } from './ObjectDashboardRoot';
import { ObjectRecord } from './types';

interface ObjectDashboardTableProps<T extends ObjectRecord> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  error?: string;
  onRowClick?: (row: T) => void;
  enableSelection?: boolean;
  enableBulkActions?: boolean;
}

export function ObjectDashboardTable<T extends ObjectRecord>({
  data,
  columns,
  loading = false,
  error,
  onRowClick,
  enableSelection = false,
  enableBulkActions = false,
}: ObjectDashboardTableProps<T>) {
  const { state, dispatch } = useDashboardContext();

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!state.search) return data;

    const searchTerm = state.search.toLowerCase();
    return data.filter((item) => {
      // Search in concrete fields
      const searchableFields = Object.keys(item).filter(
        key => typeof item[key] === 'string'
      );
      
      for (const field of searchableFields) {
        if (String(item[field]).toLowerCase().includes(searchTerm)) {
          return true;
        }
      }

      // Search in custom properties
      if (item.customProperties) {
        for (const [key, value] of Object.entries(item.customProperties)) {
          if (String(value).toLowerCase().includes(searchTerm)) {
            return true;
          }
        }
      }

      return false;
    });
  }, [data, state.search]);

  // Apply quick filter
  const finalData = useMemo(() => {
    if (!state.quickFilter) return filteredData;

    // Quick filter logic would go here based on the active filter
    // This is a simplified implementation
    return filteredData;
  }, [filteredData, state.quickFilter]);

  const handleSortingChange = (sorting: any[]) => {
    dispatch({
      type: 'SET_SORTING',
      sorting: sorting.map(sort => ({
        field: sort.id,
        direction: sort.desc ? 'desc' : 'asc',
      })),
    });
  };

  const handlePaginationChange = (pagination: any) => {
    dispatch({
      type: 'SET_PAGINATION',
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    });
  };

  const handleColumnVisibilityChange = (visibility: Record<string, boolean>) => {
    dispatch({
      type: 'SET_COLUMN_VISIBILITY',
      columnVisibility: visibility,
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Error loading data: {error}
      </div>
    );
  }

  return (
    <div className="dashboard-table">
      <PlatformTable
        data={finalData}
        columns={columns}
        loading={loading}
        onRowClick={onRowClick}
        enableSelection={enableSelection}
        enableBulkActions={enableBulkActions}
        // Pass dashboard state to table
        initialSorting={state.sorting.map(sort => ({
          id: sort.field,
          desc: sort.direction === 'desc',
        }))}
        initialPagination={state.pagination}
        initialColumnVisibility={state.columnVisibility}
        // Handle state changes
        onSortingChange={handleSortingChange}
        onPaginationChange={handlePaginationChange}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />
    </div>
  );
}