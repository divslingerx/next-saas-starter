/**
 * ObjectDashboardHeader
 * Dashboard header with title, description, and primary actions
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardContext } from './ObjectDashboardRoot';

interface ObjectDashboardHeaderProps {
  title?: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline';
  }>;
}

export function ObjectDashboardHeader({
  title,
  description,
  primaryAction,
  secondaryActions = [],
}: ObjectDashboardHeaderProps) {
  const { config } = useDashboardContext();

  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  const defaultPrimaryAction = {
    label: `Add ${config.objectType.slice(0, -1)}`,
    onClick: () => {
      // TODO: Navigate to create form or open modal
      console.log(`Create new ${config.objectType.slice(0, -1)}`);
    },
    icon: Plus,
  };

  const finalPrimaryAction = primaryAction || defaultPrimaryAction;

  return (
    <div className="dashboard-header">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{displayTitle}</h1>
          {displayDescription && (
            <p className="text-muted-foreground">{displayDescription}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
          
          <Button onClick={finalPrimaryAction.onClick}>
            {finalPrimaryAction.icon && (
              <finalPrimaryAction.icon className="mr-2 h-4 w-4" />
            )}
            {finalPrimaryAction.label}
          </Button>
        </div>
      </div>
    </div>
  );
}