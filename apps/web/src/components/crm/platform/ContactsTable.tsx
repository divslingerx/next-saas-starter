/**
 * HubSpot-style Contacts Table
 * Matches HubSpot's contact management interface design
 */

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  ChevronDown, 
  Filter,
  Download,
  Import,
  Plus,
  Building2,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Settings,
  SlidersHorizontal
} from 'lucide-react';
import { AdvancedFiltersSidebar, type AdvancedFilters } from './AdvancedFiltersSidebar';
import { ViewsManager, type ViewDefinition } from './ViewsManager';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company: {
    name: string;
    logo?: string;
  };
  leadStatus: string;
  lifecycleStage: string;
  lastActivity?: string;
  createDate: string;
  owner?: string;
}

interface ContactsTableProps {
  contacts: Contact[];
  loading?: boolean;
  title?: string; // Allow custom title
  objectType?: string; // For button text customization
  views?: ViewDefinition[]; // Custom views
  onContactSelect?: (contact: Contact) => void;
  onBulkAction?: (action: string, contacts: Contact[]) => void;
  onCreateNew?: () => void;
  onImport?: () => void;
  onViewChange?: (viewId: string) => void;
  onSaveView?: (name: string, description?: string) => void;
}

export function ContactsTable({ 
  contacts, 
  loading = false,
  title = "Contacts",
  objectType = "contact",
  views = [],
  onContactSelect,
  onBulkAction,
  onCreateNew,
  onImport,
  onViewChange,
  onSaveView
}: ContactsTableProps) {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    groups: [],
    logic: 'AND',
  });

  // Define available properties for filtering
  const availableProperties = useMemo(() => [
    { key: 'name', label: 'Name', type: 'text' as const },
    { key: 'email', label: 'Email', type: 'text' as const },
    { key: 'phone', label: 'Phone', type: 'text' as const },
    { key: 'company.name', label: 'Company', type: 'text' as const },
    { key: 'leadStatus', label: 'Lead Status', type: 'select' as const, options: ['new', 'qualified', 'unqualified', 'attempted', 'connected'] },
    { key: 'lifecycleStage', label: 'Lifecycle Stage', type: 'select' as const, options: ['customer', 'marketing-qualified-lead', 'lead', 'opportunity'] },
    { key: 'createDate', label: 'Create Date', type: 'date' as const },
    { key: 'lastActivity', label: 'Last Activity', type: 'date' as const },
    { key: 'owner', label: 'Owner', type: 'text' as const },
  ], []);

  // Count active advanced filters
  const activeAdvancedFiltersCount = useMemo(() => {
    return advancedFilters.groups.reduce((count, group) => {
      return count + group.conditions.filter(c => c.value.trim()).length;
    }, 0);
  }, [advancedFilters]);

  // Apply advanced filters
  const applyAdvancedFilters = (contacts: Contact[], filters: AdvancedFilters): Contact[] => {
    if (filters.groups.length === 0) return contacts;

    const evaluateCondition = (contact: any, condition: any): boolean => {
      const getValue = (obj: any, path: string) => {
        return path.split('.').reduce((o, p) => o?.[p], obj);
      };

      const contactValue = getValue(contact, condition.property);
      const filterValue = condition.value.toLowerCase();

      switch (condition.operator) {
        case 'is':
          return contactValue?.toLowerCase() === filterValue;
        case 'is_not':
          return contactValue?.toLowerCase() !== filterValue;
        case 'contains':
          return contactValue?.toLowerCase().includes(filterValue);
        case 'does_not_contain':
          return !contactValue?.toLowerCase().includes(filterValue);
        case 'is_empty':
          return !contactValue || contactValue.trim() === '';
        case 'is_not_empty':
          return contactValue && contactValue.trim() !== '';
        case 'is_any_of':
          return filterValue.split(',').some(v => contactValue?.toLowerCase() === v.trim());
        case 'is_none_of':
          return !filterValue.split(',').some(v => contactValue?.toLowerCase() === v.trim());
        default:
          return true;
      }
    };

    const evaluateGroup = (contact: Contact, group: any): boolean => {
      const results = group.conditions.filter((c: any) => c.value.trim()).map((condition: any) => 
        evaluateCondition(contact, condition)
      );

      if (results.length === 0) return true;

      return group.logic === 'AND' 
        ? results.every(Boolean)
        : results.some(Boolean);
    };

    return contacts.filter(contact => {
      if (filters.groups.length === 0) return true;
      
      const groupResults = filters.groups.map(group => evaluateGroup(contact, group));
      
      return filters.logic === 'AND'
        ? groupResults.every(Boolean)
        : groupResults.some(Boolean);
    });
  };

  // Filter contacts based on active tab
  const filteredContacts = useMemo(() => {
    let filtered = contacts;
    
    // Apply tab filter
    switch (activeTab) {
      case 'marketing':
        filtered = filtered.filter(c => c.lifecycleStage === 'marketing-qualified-lead');
        break;
      case 'unassigned':
        filtered = filtered.filter(c => !c.owner);
        break;
      // Add more tab filters as needed
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply advanced filters
    filtered = applyAdvancedFilters(filtered, advancedFilters);
    
    return filtered;
  }, [contacts, activeTab, searchTerm, advancedFilters, applyAdvancedFilters]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts([...filteredContacts]);
    } else {
      setSelectedContacts([]);
    }
  };

  const handleContactToggle = (contact: Contact, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contact]);
    } else {
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
    }
  };

  const isAllSelected = filteredContacts.length > 0 && selectedContacts.length === filteredContacts.length;
  const isIndeterminate = selectedContacts.length > 0 && selectedContacts.length < filteredContacts.length;

  const getLeadStatusBadge = (status: string) => {
    const statusStyles = {
      'new': 'bg-blue-100 text-blue-800',
      'qualified': 'bg-green-100 text-green-800', 
      'unqualified': 'bg-gray-100 text-gray-800',
      'attempted': 'bg-yellow-100 text-yellow-800',
      'connected': 'bg-purple-100 text-purple-800',
    };
    
    return (
      <Badge variant="outline" className={statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{title}</h1>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">{filteredContacts.length} records</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 h-8 text-xs">
            Data Quality
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Actions <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onImport} className="text-xs">
                <Import className="h-3 w-3 mr-2" />
                Import
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs">
                <Download className="h-3 w-3 mr-2" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={onImport} className="h-8 text-xs">
            Import
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 h-8 text-xs" onClick={onCreateNew}>
            Create {objectType}
          </Button>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b">
          <TabsList className="bg-transparent h-auto p-0 space-x-0">
            <TabsTrigger 
              value="all" 
              className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none px-3 py-2 text-sm"
            >
              All contacts
            </TabsTrigger>
            <TabsTrigger 
              value="marketing"
              className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none px-3 py-2 text-sm"
            >
              Marketing Contacts
            </TabsTrigger>
            <TabsTrigger 
              value="unassigned"
              className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none px-3 py-2 text-sm"
            >
              Unassigned contacts
            </TabsTrigger>
            <TabsTrigger 
              value="custom"
              className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none px-3 py-2 text-sm"
            >
              Massachusetts Good Fit L...
            </TabsTrigger>
          </TabsList>
          
          <ViewsManager
            views={views}
            activeViewId={activeTab}
            onViewChange={onViewChange || (() => {})}
            onSaveView={onSaveView || (() => {})}
            maxViews={50}
            currentViewCount={views.length + 4} // Platform views + custom views
            objectType={objectType}
          />
        </div>

        <TabsContent value={activeTab} className="space-y-3">
          {/* Filters Section */}
          <div className="flex items-center gap-2 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Contact owner <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="text-xs">All owners</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Assigned to me</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Unassigned</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Create date <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="text-xs">All time</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Today</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">This week</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">This month</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Last activity date <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="text-xs">All time</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Today</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">This week</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Lead status <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="text-xs">All statuses</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">New</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Qualified</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Unqualified</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-600 h-8 text-xs"
              onClick={() => setIsAdvancedFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-3 w-3 mr-1" />
              Advanced filters ({activeAdvancedFiltersCount})
            </Button>
          </div>

          {/* Search and Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search name, phone, email, etc."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Export
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Edit columns
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card className="border border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          ref={(ref) => {
                            if (ref) {
                              ref.indeterminate = isIndeterminate;
                            }
                          }}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">NAME</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">EMAIL</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">CONTACT → COMPANY (PRIMARY)</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">CONTACT → COMPANIES</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">CONTACT OWNER</th>
                      <th className="px-3 py-2 text-left w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-3">
                          <Checkbox
                            checked={selectedContacts.some(c => c.id === contact.id)}
                            onCheckedChange={(checked) => handleContactToggle(contact, checked as boolean)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                              {getInitials(contact.name)}
                            </div>
                            <span className="hover:underline font-medium cursor-pointer">
                              {contact.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                            {contact.email}
                          </a>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-blue-600 hover:underline cursor-pointer">
                              {contact.company.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-blue-600 hover:underline cursor-pointer">
                              {contact.company.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-muted-foreground">--</span>
                        </td>
                        <td className="px-3 py-3">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Advanced Filters Sidebar */}
      <AdvancedFiltersSidebar
        open={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        properties={availableProperties}
        objectType={objectType}
      />
    </div>
  );
}