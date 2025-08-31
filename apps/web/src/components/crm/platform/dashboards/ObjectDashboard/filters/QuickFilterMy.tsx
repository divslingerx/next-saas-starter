/**
 * QuickFilterMy
 * Shows records owned by current user
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { useDashboardContext } from '../ObjectDashboardRoot';

interface QuickFilterMyProps {
  label?: string;
  currentUserId?: string; // TODO: Get from auth context
}

export function QuickFilterMy({ label, currentUserId }: QuickFilterMyProps) {
  const { config, state, dispatch } = useDashboardContext();

  const displayLabel = label || `My ${config.title}`;
  const isActive = state.quickFilter === 'my';

  const handleClick = () => {
    if (isActive) {
      dispatch({ type: 'SET_QUICK_FILTER', quickFilter: null });
    } else {
      dispatch({ type: 'SET_QUICK_FILTER', quickFilter: 'my' });
      // Also set the owner filter
      dispatch({
        type: 'SET_FILTERS',
        filters: {
          ...state.filters,
          assignedToUserId: currentUserId, // This will need to match your schema
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