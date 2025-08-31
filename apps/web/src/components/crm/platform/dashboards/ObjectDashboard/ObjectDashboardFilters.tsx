/**
 * ObjectDashboardFilters
 * Flexible filtering system with quick filters and search
 */

import React, { ReactNode } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDashboardContext } from './ObjectDashboardRoot';

interface ObjectDashboardFiltersProps {
  children?: ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export function ObjectDashboardFilters({
  children,
  showSearch = true,
  searchPlaceholder,
}: ObjectDashboardFiltersProps) {
  const { config, state, dispatch } = useDashboardContext();

  const handleSearchChange = (value: string) => {
    dispatch({ type: 'SET_SEARCH', search: value });
  };

  const clearFilters = () => {
    dispatch({ type: 'RESET_FILTERS' });
  };

  const activeFiltersCount = 
    Object.keys(state.filters).length + 
    (state.quickFilter ? 1 : 0) + 
    (state.search ? 1 : 0);

  return (
    <div className="dashboard-filters space-y-4">
      {/* Search and Clear */}
      <div className="flex items-center justify-between">
        {showSearch && (
          <div className="flex items-center space-x-2 flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder || `Search ${config.objectType}...`}
                value={state.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        )}

        {activeFiltersCount > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Filter Content */}
      {children && (
        <div className="filter-content">
          <div className="flex flex-wrap gap-2">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}