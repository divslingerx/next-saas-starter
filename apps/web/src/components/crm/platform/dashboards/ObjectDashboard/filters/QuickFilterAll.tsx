/**
 * QuickFilterAll
 * Shows all records without filtering
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { useDashboardContext } from '../ObjectDashboardRoot';

interface QuickFilterAllProps {
  label?: string;
}

export function QuickFilterAll({ label }: QuickFilterAllProps) {
  const { config, state, dispatch } = useDashboardContext();

  const displayLabel = label || `All ${config.title}`;
  const isActive = state.quickFilter === null || state.quickFilter === 'all';

  const handleClick = () => {
    dispatch({ type: 'SET_QUICK_FILTER', quickFilter: null });
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