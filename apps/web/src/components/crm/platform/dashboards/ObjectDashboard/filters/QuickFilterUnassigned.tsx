/**
 * QuickFilterUnassigned
 * Shows records without an owner
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { useDashboardContext } from '../ObjectDashboardRoot';

interface QuickFilterUnassignedProps {
  label?: string;
}

export function QuickFilterUnassigned({ label }: QuickFilterUnassignedProps) {
  const { config, state, dispatch } = useDashboardContext();

  const displayLabel = label || `Unassigned ${config.title}`;
  const isActive = state.quickFilter === 'unassigned';

  const handleClick = () => {
    if (isActive) {
      dispatch({ type: 'SET_QUICK_FILTER', quickFilter: null });
    } else {
      dispatch({ type: 'SET_QUICK_FILTER', quickFilter: 'unassigned' });
      // Set the unassigned filter
      dispatch({
        type: 'SET_FILTERS',
        filters: {
          ...state.filters,
          assignedToUserId: null,
        },
      });
    }
  };

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      className="text-xs"
    >
      {displayLabel}
    </Button>
  );
}