/**
 * Contacts Dashboard Configuration
 * Configuration for contacts object type
 */

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Mail, Phone, Building2 } from 'lucide-react';
import { DashboardConfig, StatsCard } from '../ObjectDashboard/types';

// Contact record type based on our CRM schema
interface Contact {
  id: number;
  organizationId: string;
  objectId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  primaryCompanyId?: number;
  jobTitle?: string;
  preferredContactMethod: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
  customProperties?: Record<string, any>;
  
  // Related data (from joins)
  primaryCompany?: {
    id: number;
    name: string;
  };
}

export const contactsConfig: DashboardConfig = {
  objectType: 'contacts',
  title: 'Contacts',
  description: 'Manage individual people and decision makers',
  primaryFields: ['firstName', 'lastName', 'email', 'jobTitle', 'primaryCompanyId'],
  searchFields: ['firstName', 'lastName', 'email', 'jobTitle'],
  quickFilters: [
    {
      key: 'all',
      label: 'All Contacts',
      condition: {},
    },
    {
      key: 'my',
      label: 'My Contacts',
      condition: { assignedToUserId: 'current_user' },
    },
    {
      key: 'decision_makers',
      label: 'Decision Makers',
      condition: { role: 'decision_maker' },
    },
    {
      key: 'recent',
      label: 'Recently Added',
      condition: { createdWithin: '7d' },
    },
  ],
  defaultSort: {
    field: 'lastName',
    direction: 'asc',
  },
};

export const contactsColumns: ColumnDef<Contact>[] = [
  {
    id: 'name',
    accessorFn: (contact) => [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'N/A',
    header: 'Name',
    cell: ({ row }) => {
      const contact = row.original;
      const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'N/A';
      
      return (
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <span className="text-xs font-medium">
              {contact.firstName?.[0] || contact.lastName?.[0] || '?'}
            </span>
          </div>
          <div>
            <div className="font-medium">{fullName}</div>
            <div className="text-sm text-muted-foreground">{contact.jobTitle}</div>
          </div>
        </div>
      );
    },
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.getValue('email') as string;
      return (
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{email}</span>
        </div>
      );
    },
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => {
      const phone = row.getValue('phone') as string;
      if (!phone) return <span className="text-muted-foreground">—</span>;
      
      return (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{phone}</span>
        </div>
      );
    },
  },
  {
    id: 'primaryCompany',
    accessorKey: 'primaryCompany',
    header: 'Company',
    cell: ({ row }) => {
      const contact = row.original;
      if (!contact.primaryCompany) {
        return <span className="text-muted-foreground">—</span>;
      }
      
      return (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{contact.primaryCompany.name}</span>
        </div>
      );
    },
  },
  {
    id: 'preferredContactMethod',
    accessorKey: 'preferredContactMethod',
    header: 'Preferred Contact',
    cell: ({ row }) => {
      const method = row.getValue('preferredContactMethod') as string;
      return <Badge variant="outline" className="text-xs">{method}</Badge>;
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

export const contactsStatsCards: StatsCard[] = [
  {
    id: 'total',
    title: 'Total Contacts',
    value: 0, // Will be populated by data
    icon: Mail,
  },
  {
    id: 'decision_makers',
    title: 'Decision Makers',
    value: 0,
    icon: Building2,
  },
  {
    id: 'recent',
    title: 'Added This Month',
    value: 0,
    change: {
      value: 12,
      type: 'increase',
      period: 'last month',
    },
  },
  {
    id: 'companies_represented',
    title: 'Companies',
    value: 0,
    icon: Building2,
  },
];