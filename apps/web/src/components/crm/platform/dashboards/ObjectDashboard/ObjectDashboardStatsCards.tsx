/**
 * ObjectDashboardStatsCards
 * Container for stats cards with default layout
 */

import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { StatsCard } from './types';

interface ObjectDashboardStatsCardsProps {
  children?: ReactNode;
  stats?: StatsCard[];
}

export function ObjectDashboardStatsCards({
  children,
  stats = [],
}: ObjectDashboardStatsCardsProps) {
  if (children) {
    return (
      <div className="dashboard-stats-cards">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {children}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="dashboard-stats-cards">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>
    </div>
  );
}

interface StatCardProps {
  stat: StatsCard;
}

function StatCard({ stat }: StatCardProps) {
  const { title, value, change, icon: Icon, color = 'default' } = stat;

  const colorClasses = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClasses[color]}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {change && (
          <div className="flex items-center pt-1">
            {change.type === 'increase' ? (
              <ArrowUp className="h-3 w-3 text-green-600" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-600" />
            )}
            <span
              className={`text-xs ml-1 ${
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change.value}% from {change.period}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}