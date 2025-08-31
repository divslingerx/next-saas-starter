"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Activity, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Building2,
  Mail,
  Phone,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Star
} from "lucide-react";
import type { PlatformRecord } from "./PlatformTable";

export interface StatCard {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
}

interface ObjectStatsCardsProps {
  objectType: string;
  data: PlatformRecord[];
}

export function ObjectStatsCards({ objectType, data }: ObjectStatsCardsProps) {
  const stats = useMemo(() => {
    return calculateStatsForObjectType(objectType, data);
  }, [objectType, data]);

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getValueClassName(stat.variant)}`}>
              {stat.value}
            </div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function calculateStatsForObjectType(objectType: string, data: PlatformRecord[]): StatCard[] {
  const total = data.length;

  switch (objectType) {
    case 'clients':
      return calculateClientStats(data, total);
    
    case 'contacts':
      return calculateContactStats(data, total);
    
    case 'deals':
      return calculateDealStats(data, total);
      
    case 'tickets':
      return calculateTicketStats(data, total);
      
    case 'projects':
      return calculateProjectStats(data, total);
      
    case 'invoices':
      return calculateInvoiceStats(data, total);
      
    default:
      return calculateGenericStats(data, total, objectType);
  }
}

function calculateClientStats(data: PlatformRecord[], total: number): StatCard[] {
  const customers = data.filter(c => c.properties.lifecycle_stage === 'customer').length;
  const totalRevenue = data.reduce((sum, client) => sum + (client.properties.revenue || 0), 0);
  const avgRevenue = total > 0 ? totalRevenue / total : 0;
  const customerRate = total > 0 ? Math.round((customers / total) * 100) : 0;

  return [
    {
      title: 'Total Clients',
      value: total,
      description: `${customers} customers, ${total - customers} prospects`,
      icon: Users,
    },
    {
      title: 'Total Revenue',
      value: `$${(totalRevenue / 1000000).toFixed(1)}M`,
      description: 'Across all clients',
      icon: DollarSign,
      variant: 'positive',
    },
    {
      title: 'Average Revenue',
      value: `$${(avgRevenue / 1000000).toFixed(1)}M`,
      description: 'Per client average',
      icon: TrendingUp,
    },
    {
      title: 'Customer Rate',
      value: `${customerRate}%`,
      description: 'Conversion to customer',
      icon: Activity,
      variant: customerRate > 50 ? 'positive' : customerRate > 25 ? 'default' : 'warning',
    },
  ];
}

function calculateContactStats(data: PlatformRecord[], total: number): StatCard[] {
  const active = data.filter(c => c.properties.status === 'active').length;
  const withEmail = data.filter(c => c.properties.email).length;
  const withPhone = data.filter(c => c.properties.phone).length;
  const emailRate = total > 0 ? Math.round((withEmail / total) * 100) : 0;

  return [
    {
      title: 'Total Contacts',
      value: total,
      description: `${active} active contacts`,
      icon: Users,
    },
    {
      title: 'Email Coverage',
      value: `${emailRate}%`,
      description: `${withEmail} contacts with email`,
      icon: Mail,
      variant: emailRate > 80 ? 'positive' : emailRate > 50 ? 'default' : 'warning',
    },
    {
      title: 'Phone Numbers',
      value: withPhone,
      description: `${Math.round((withPhone / total) * 100)}% have phone`,
      icon: Phone,
    },
    {
      title: 'Active Status',
      value: active,
      description: `${Math.round((active / total) * 100)}% active`,
      icon: CheckCircle,
      variant: active === total ? 'positive' : 'default',
    },
  ];
}

function calculateDealStats(data: PlatformRecord[], total: number): StatCard[] {
  const won = data.filter(d => d.properties.status === 'won').length;
  const lost = data.filter(d => d.properties.status === 'lost').length;
  const open = total - won - lost;
  const totalValue = data.reduce((sum, deal) => sum + (deal.properties.value || 0), 0);
  const winRate = (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  return [
    {
      title: 'Total Deals',
      value: total,
      description: `${open} open, ${won} won, ${lost} lost`,
      icon: Target,
    },
    {
      title: 'Deal Value',
      value: `$${(totalValue / 1000000).toFixed(1)}M`,
      description: 'Total pipeline value',
      icon: DollarSign,
      variant: 'positive',
    },
    {
      title: 'Win Rate',
      value: `${winRate}%`,
      description: 'Closed deals won',
      icon: TrendingUp,
      variant: winRate > 50 ? 'positive' : winRate > 25 ? 'default' : 'negative',
    },
    {
      title: 'Open Deals',
      value: open,
      description: 'Active opportunities',
      icon: Activity,
    },
  ];
}

function calculateTicketStats(data: PlatformRecord[], total: number): StatCard[] {
  const open = data.filter(t => ['new', 'open', 'in_progress'].includes(t.properties.status)).length;
  const closed = data.filter(t => t.properties.status === 'closed').length;
  const highPriority = data.filter(t => ['high', 'urgent'].includes(t.properties.priority)).length;
  const avgResolutionTime = calculateAverageResolutionTime(data);

  return [
    {
      title: 'Total Tickets',
      value: total,
      description: `${open} open, ${closed} closed`,
      icon: AlertCircle,
    },
    {
      title: 'Open Tickets',
      value: open,
      description: 'Need attention',
      icon: Clock,
      variant: open > total * 0.7 ? 'warning' : 'default',
    },
    {
      title: 'High Priority',
      value: highPriority,
      description: 'Urgent tickets',
      icon: Star,
      variant: highPriority > 0 ? 'warning' : 'positive',
    },
    {
      title: 'Avg Resolution',
      value: avgResolutionTime,
      description: 'Time to resolve',
      icon: TrendingUp,
    },
  ];
}

function calculateProjectStats(data: PlatformRecord[], total: number): StatCard[] {
  const active = data.filter(p => p.properties.status === 'active').length;
  const completed = data.filter(p => p.properties.status === 'completed').length;
  const onHold = data.filter(p => p.properties.status === 'on_hold').length;
  const totalBudget = data.reduce((sum, project) => sum + (project.properties.budget || 0), 0);

  return [
    {
      title: 'Total Projects',
      value: total,
      description: `${active} active, ${completed} done`,
      icon: Building2,
    },
    {
      title: 'Active Projects',
      value: active,
      description: 'In progress',
      icon: Activity,
      variant: 'positive',
    },
    {
      title: 'Total Budget',
      value: `$${(totalBudget / 1000000).toFixed(1)}M`,
      description: 'Across all projects',
      icon: DollarSign,
    },
    {
      title: 'On Hold',
      value: onHold,
      description: 'Paused projects',
      icon: AlertCircle,
      variant: onHold > 0 ? 'warning' : 'positive',
    },
  ];
}

function calculateInvoiceStats(data: PlatformRecord[], total: number): StatCard[] {
  const paid = data.filter(i => i.properties.status === 'paid').length;
  const overdue = data.filter(i => i.properties.status === 'overdue').length;
  const totalAmount = data.reduce((sum, invoice) => sum + (invoice.properties.amount || 0), 0);
  const paidAmount = data
    .filter(i => i.properties.status === 'paid')
    .reduce((sum, invoice) => sum + (invoice.properties.amount || 0), 0);

  return [
    {
      title: 'Total Invoices',
      value: total,
      description: `${paid} paid, ${overdue} overdue`,
      icon: DollarSign,
    },
    {
      title: 'Total Amount',
      value: `$${(totalAmount / 1000).toFixed(0)}K`,
      description: 'All invoices',
      icon: DollarSign,
    },
    {
      title: 'Amount Paid',
      value: `$${(paidAmount / 1000).toFixed(0)}K`,
      description: 'Collected revenue',
      icon: CheckCircle,
      variant: 'positive',
    },
    {
      title: 'Overdue',
      value: overdue,
      description: 'Need follow-up',
      icon: AlertCircle,
      variant: overdue > 0 ? 'negative' : 'positive',
    },
  ];
}

function calculateGenericStats(data: PlatformRecord[], total: number, objectType: string): StatCard[] {
  const recentCount = data.filter(item => {
    const createdAt = new Date(item.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdAt > thirtyDaysAgo;
  }).length;

  return [
    {
      title: `Total ${objectType.charAt(0).toUpperCase() + objectType.slice(1)}`,
      value: total,
      description: `${recentCount} added in last 30 days`,
      icon: Users,
    },
    {
      title: 'Recent Activity',
      value: recentCount,
      description: 'Added this month',
      icon: Calendar,
      variant: recentCount > 0 ? 'positive' : 'default',
    },
  ];
}

function calculateAverageResolutionTime(tickets: PlatformRecord[]): string {
  const closedTickets = tickets.filter(t => t.properties.status === 'closed');
  if (closedTickets.length === 0) return 'N/A';
  
  // This would need actual resolution time calculation based on your data structure
  // For now, returning a placeholder
  return '2.5 days';
}

function getValueClassName(variant?: string): string {
  switch (variant) {
    case 'positive':
      return 'text-green-600';
    case 'negative':
      return 'text-red-600';
    case 'warning':
      return 'text-yellow-600';
    default:
      return '';
  }
}