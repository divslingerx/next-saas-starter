/**
 * ObjectDashboardRoot
 * Root container component that provides dashboard context and state management
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CrmObjectType, DashboardState, DashboardConfig } from './types';

interface DashboardContextValue {
  objectType: CrmObjectType;
  config: DashboardConfig;
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
}

type DashboardAction =
  | { type: 'SET_FILTERS'; filters: Record<string, any> }
  | { type: 'SET_QUICK_FILTER'; quickFilter: string | null }
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_SORTING'; sorting: { field: string; direction: 'asc' | 'desc' }[] }
  | { type: 'SET_PAGINATION'; pagination: { pageIndex: number; pageSize: number } }
  | { type: 'SET_COLUMN_VISIBILITY'; columnVisibility: Record<string, boolean> }
  | { type: 'RESET_FILTERS' };

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within ObjectDashboard.Root');
  }
  return context;
}

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_FILTERS':
      return { ...state, filters: action.filters };
    case 'SET_QUICK_FILTER':
      return { ...state, quickFilter: action.quickFilter };
    case 'SET_SEARCH':
      return { ...state, search: action.search };
    case 'SET_SORTING':
      return { ...state, sorting: action.sorting };
    case 'SET_PAGINATION':
      return { ...state, pagination: action.pagination };
    case 'SET_COLUMN_VISIBILITY':
      return { ...state, columnVisibility: action.columnVisibility };
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {},
        quickFilter: null,
        search: '',
      };
    default:
      return state;
  }
}

interface ObjectDashboardRootProps {
  objectType: CrmObjectType;
  config: DashboardConfig;
  children: ReactNode;
  className?: string;
}

export function ObjectDashboardRoot({
  objectType,
  config,
  children,
  className = '',
}: ObjectDashboardRootProps) {
  const [state, dispatch] = useReducer(dashboardReducer, {
    filters: {},
    quickFilter: null,
    search: '',
    sorting: config.defaultSort ? [config.defaultSort] : [],
    pagination: { pageIndex: 0, pageSize: 50 },
    columnVisibility: {},
  });

  const contextValue: DashboardContextValue = {
    objectType,
    config,
    state,
    dispatch,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className={`dashboard-root space-y-6 ${className}`}>
        {children}
      </div>
    </DashboardContext.Provider>
  );
}