/**
 * Lists Table Component
 * HubSpot-style lists management interface
 */

import React, { useState, useMemo, useCallback } from 'react';
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
  Download,
  Import,
  Plus,
  Users,
  List,
  Calendar,
  MoreHorizontal,
  Settings,
  SlidersHorizontal,
  Folder,
  Target
} from 'lucide-react';
import { AdvancedFiltersSidebar, type AdvancedFilters } from './AdvancedFiltersSidebar';
import { ViewsManager, type ViewDefinition } from './ViewsManager';

interface ListItem {
  id: number;
  name: string;
  listSize: number;
  type: 'smart' | 'static';
  objectType: string;
  lastUpdated: string;
  creator: string;
  folder?: string;
  usedIn: number; // Count of where it's used
  createdAt: string;
  isDeleted?: boolean;
}

interface ListsTableProps {
  lists: ListItem[];
  loading?: boolean;
  title?: string;
  objectType?: string;
  views?: ViewDefinition[];
  onListSelect?: (list: ListItem) => void;
  onBulkAction?: (action: string, lists: ListItem[]) => void;
  onCreateNew?: () => void;
  onImport?: () => void;
  onViewChange?: (viewId: string) => void;
  onSaveView?: (name: string, description?: string) => void;
}

export function ListsTable({ 
  lists, 
  loading = false,
  title = "Lists",
  objectType = "list",
  views = [],
  onListSelect,
  onBulkAction,
  onCreateNew,
  onImport,
  onViewChange,
  onSaveView
}: ListsTableProps) {
  const [selectedLists, setSelectedLists] = useState<ListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all-lists');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    groups: [],
    logic: 'AND',
  });

  // Define available properties for filtering
  const availableProperties = useMemo(() => [
    { key: 'name', label: 'Name', type: 'text' as const },
    { key: 'type', label: 'Type', type: 'select' as const, options: ['smart', 'static'] },
    { key: 'objectType', label: 'Object Type', type: 'select' as const, options: ['contacts', 'companies', 'deals', 'tickets'] },
    { key: 'creator', label: 'Creator', type: 'text' as const },
    { key: 'folder', label: 'Folder', type: 'text' as const },
    { key: 'listSize', label: 'List Size', type: 'number' as const },
    { key: 'usedIn', label: 'Used In Count', type: 'number' as const },
    { key: 'lastUpdated', label: 'Last Updated', type: 'date' as const },
    { key: 'createdAt', label: 'Created Date', type: 'date' as const },
  ], []);

  // Count active advanced filters
  const activeAdvancedFiltersCount = useMemo(() => {
    return advancedFilters.groups.reduce((count, group) => {
      return count + group.conditions.filter(c => c.value.trim()).length;
    }, 0);
  }, [advancedFilters]);

  // Apply advanced filters (simplified logic for demo)
  const applyAdvancedFilters = (lists: ListItem[], filters: AdvancedFilters): ListItem[] => {
    if (filters.groups.length === 0) return lists;
    // TODO: Implement actual filtering logic
    return lists;
  };

  // Filter lists based on active tab and search
  const filteredLists = useMemo(() => {
    let filtered = lists;
    
    // Apply tab filter
    switch (activeTab) {
      case 'all-lists':
        filtered = filtered.filter(l => !l.isDeleted);
        break;
      case 'unused-lists':
        filtered = filtered.filter(l => !l.isDeleted && l.usedIn === 0);
        break;
      case 'recently-deleted':
        filtered = filtered.filter(l => l.isDeleted);
        break;
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(list => 
        list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.objectType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply advanced filters
    filtered = applyAdvancedFilters(filtered, advancedFilters);
    
    return filtered;
  }, [lists, activeTab, searchTerm, advancedFilters, applyAdvancedFilters]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLists([...filteredLists]);
    } else {
      setSelectedLists([]);
    }
  };

  const handleListToggle = (list: ListItem, checked: boolean) => {
    if (checked) {
      setSelectedLists(prev => [...prev, list]);
    } else {
      setSelectedLists(prev => prev.filter(l => l.id !== list.id));
    }
  };

  const handleViewChange = useCallback((viewId: string) => {
    console.log('List view changed to:', viewId);
    if (onViewChange) onViewChange(viewId);
  }, [onViewChange]);

  const handleSaveView = useCallback((name: string, description?: string) => {
    console.log('Save list view:', { name, description });
    if (onSaveView) onSaveView(name, description);
  }, [onSaveView]);

  const isAllSelected = filteredLists.length > 0 && selectedLists.length === filteredLists.length;
  const isIndeterminate = selectedLists.length > 0 && selectedLists.length < filteredLists.length;

  const getTypeIcon = (type: string) => {
    return type === 'smart' ? <Target className="h-3 w-3" /> : <List className="h-3 w-3" />;
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'smart' ? 'default' : 'secondary'} className="text-xs">
        <span className="flex items-center gap-1">
          {getTypeIcon(type)}
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
      </Badge>
    );
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
          <span className="text-xs text-muted-foreground">{filteredLists.length} lists</span>
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
              value="all-lists" 
              className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none px-3 py-2 text-sm"
            >
              All Lists
            </TabsTrigger>
            <TabsTrigger 
              value="unused-lists"
              className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none px-3 py-2 text-sm"
            >
              Unused Lists
            </TabsTrigger>
            <TabsTrigger 
              value="recently-deleted"
              className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none px-3 py-2 text-sm"
            >
              Recently Deleted
            </TabsTrigger>
          </TabsList>
          
          <ViewsManager
            views={views}
            activeViewId={activeTab}
            onViewChange={handleViewChange}
            onSaveView={handleSaveView}
            maxViews={50}
            currentViewCount={views.length + 3} // Platform views + custom views
            objectType={objectType}
          />
        </div>

        <TabsContent value={activeTab} className="space-y-3">
          {/* Filters Section */}
          <div className="flex items-center gap-2 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  All creators <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="text-xs">All creators</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Created by me</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">John Smith</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Sarah Johnson</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  All types <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="text-xs">All types</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Smart lists</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Static lists</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  All objects <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="text-xs">All objects</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Contacts</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Companies</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Deals</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Tickets</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Used in <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="text-xs">Any usage</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Workflows</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Email campaigns</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Forms</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Reports</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  More <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="text-xs">List properties</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Creation date</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Folder</DropdownMenuItem>
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
                placeholder="Search lists..."
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
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">LIST SIZE</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">TYPE</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">OBJECT</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">LAST UPDATED</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">CREATOR</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">FOLDER</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">USED IN</th>
                      <th className="px-3 py-2 text-left w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLists.map((list) => (
                      <tr key={list.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-3">
                          <Checkbox
                            checked={selectedLists.some(l => l.id === list.id)}
                            onCheckedChange={(checked) => handleListToggle(list, checked as boolean)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                              <List className="h-3 w-3" />
                            </div>
                            <span className="hover:underline font-medium cursor-pointer">
                              {list.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm">{list.listSize.toLocaleString()}</span>
                        </td>
                        <td className="px-3 py-3">
                          {getTypeBadge(list.type)}
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm capitalize">{list.objectType}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm">{new Date(list.lastUpdated).toLocaleDateString()}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm">{list.creator}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {list.folder ? (
                              <>
                                <Folder className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{list.folder}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm">{list.usedIn}</span>
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