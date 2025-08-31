/**
 * Companies Dashboard Configuration
 * Configuration for companies object type
 */

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Building2, Users, Globe, MapPin } from 'lucide-react';
import { DashboardConfig, StatsCard } from '../ObjectDashboard/types';

// Company record type based on our CRM schema
interface Company {
  id: number;
  organizationId: string;
  objectId: number;
  name: string;
  domain?: string;
  industry?: string;
  sizeCategory?: string;
  annualRevenue?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  clientType: string;
  createdAt: string;
  updatedAt: string;
  customProperties?: Record<string, any>;
}

export const companiesConfig: DashboardConfig = {
  objectType: 'companies',
  title: 'Companies',
  description: 'Manage organizations and business accounts',
  primaryFields: ['name', 'domain', 'industry', 'sizeCategory', 'clientType'],
  searchFields: ['name', 'domain', 'industry'],
  quickFilters: [
    {
      key: 'all',
      label: 'All Companies',
      condition: {},
    },
    {
      key: 'prospects',
      label: 'Prospects',
      condition: { clientType: 'prospect' },
    },
    {
      key: 'active_clients',
      label: 'Active Clients',
      condition: { clientType: 'active' },
    },
    {
      key: 'recent',
      label: 'Recently Added',
      condition: { createdWithin: '7d' },
    },
  ],
  defaultSort: {
    field: 'name',
    direction: 'asc',
  },
};

export const companiesColumns: ColumnDef<Company>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Company',
    cell: ({ row }) => {
      const company = row.original;
      
      return (
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">{company.name}</div>
            {company.domain && (
              <div className="text-sm text-muted-foreground flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                {company.domain}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: 'industry',
    accessorKey: 'industry',
    header: 'Industry',
    cell: ({ row }) => {
      const industry = row.getValue('industry') as string;
      if (!industry) return <span className="text-muted-foreground">—</span>;
      
      return <Badge variant="outline" className="text-xs">{industry}</Badge>;
    },
  },
  {
    id: 'sizeCategory',
    accessorKey: 'sizeCategory',
    header: 'Size',
    cell: ({ row }) => {
      const size = row.getValue('sizeCategory') as string;
      if (!size) return <span className="text-muted-foreground">—</span>;
      
      const sizeLabels: Record<string, string> = {
        startup: 'Startup',
        small: 'Small',
        medium: 'Medium',
        enterprise: 'Enterprise',
      };
      
      return (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{sizeLabels[size] || size}</span>
        </div>
      );
    },
  },
  {
    id: 'location',
    accessorFn: (company) => [company.city, company.state, company.country].filter(Boolean).join(', '),
    header: 'Location',
    cell: ({ row }) => {
      const company = row.original;
      const location = [company.city, company.state, company.country]
        .filter(Boolean)
        .join(', ');
      
      if (!location) return <span className="text-muted-foreground">—</span>;
      
      return (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{location}</span>
        </div>
      );
    },
  },
  {
    id: 'clientType',
    accessorKey: 'clientType',
    header: 'Status',
    cell: ({ row }) => {
      const clientType = row.getValue('clientType') as string;
      
      const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        prospect: { label: 'Prospect', variant: 'outline' },
        active: { label: 'Active Client', variant: 'default' },
        'past-client': { label: 'Past Client', variant: 'secondary' },
        partner: { label: 'Partner', variant: 'default' },
      };
      
      const config = statusConfig[clientType] || { label: clientType, variant: 'outline' };
      
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    id: 'annualRevenue',
    accessorKey: 'annualRevenue',
    header: 'Revenue',
    cell: ({ row }) => {
      const revenue = row.getValue('annualRevenue') as string;
      if (!revenue) return <span className="text-muted-foreground">—</span>;
      
      return <span className="text-sm font-medium">{revenue}</span>;
    },
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string;
      return <span className="text-sm">{new Date(date).toLocaleDateString()}</span>;
    },
  },
  {
    id: 'actions',
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      );
    },
  },
];

export const companiesStatsCards: StatsCard[] = [
  {
    id: 'total',
    title: 'Total Companies',
    value: 0, // Will be populated by data
    icon: Building2,
  },
  {
    id: 'prospects',
    title: 'Active Prospects',
    value: 0,
    icon: Users,
    color: 'warning',
  },
  {
    id: 'clients',
    title: 'Active Clients',
    value: 0,
    icon: Building2,
    color: 'success',
  },
  {
    id: 'recent',
    title: 'Added This Month',
    value: 0,
    change: {
      value: 8,
      type: 'increase',
      period: 'last month',
    },
  },
];