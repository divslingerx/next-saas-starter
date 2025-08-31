/**
 * Views Manager Component
 * HubSpot-style view management with platform and custom views
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  ChevronDown, 
  Search, 
  Zap, 
  User, 
  Users, 
  Building2,
  Eye,
  Save,
  Settings
} from 'lucide-react';

export interface ViewDefinition {
  id: string;
  name: string;
  type: 'platform' | 'organization' | 'personal';
  description?: string;
  filters?: any;
  isActive?: boolean;
  recordCount?: number;
  icon?: React.ElementType;
  provider?: 'hubspot' | 'system' | 'user';
}

interface ViewsManagerProps {
  views: ViewDefinition[];
  activeViewId?: string;
  onViewChange: (viewId: string) => void;
  onSaveView: (name: string, description?: string) => void;
  onEditView?: (viewId: string) => void;
  maxViews?: number;
  currentViewCount?: number;
  objectType: string;
}

// Default platform views that come from HubSpot/system
const getDefaultPlatformViews = (objectType: string): ViewDefinition[] => {
  const contactViews: ViewDefinition[] = [
    {
      id: 'all-contacts',
      name: 'All contacts',
      type: 'platform',
      provider: 'hubspot',
      description: 'All contacts in your database',
      icon: Users,
      recordCount: 0,
    },
    {
      id: 'marketing-contacts',
      name: 'Marketing Contacts',
      type: 'platform',
      provider: 'hubspot',
      description: 'Contacts eligible for marketing emails',
      icon: Zap,
      recordCount: 0,
    },
    {
      id: 'my-contacts',
      name: 'My contacts',
      type: 'platform', 
      provider: 'system',
      description: 'Contacts assigned to me',
      icon: User,
      recordCount: 0,
    },
    {
      id: 'unassigned-contacts',
      name: 'Unassigned contacts',
      type: 'platform',
      provider: 'system', 
      description: 'Contacts without an owner',
      icon: Users,
      recordCount: 0,
    },
  ];

  const companyViews: ViewDefinition[] = [
    {
      id: 'all-companies',
      name: 'All companies',
      type: 'platform',
      provider: 'hubspot',
      description: 'All companies in your database',
      icon: Building2,
      recordCount: 0,
    },
    {
      id: 'my-companies',
      name: 'My companies',
      type: 'platform',
      provider: 'system',
      description: 'Companies assigned to me',
      icon: User,
      recordCount: 0,
    },
  ];

  const listViews: ViewDefinition[] = [
    {
      id: 'all-lists',
      name: 'All Lists',
      type: 'platform',
      provider: 'system',
      description: 'All lists in your account',
      icon: Eye,
      recordCount: 0,
    },
    {
      id: 'unused-lists',
      name: 'Unused Lists',
      type: 'platform',
      provider: 'system',
      description: 'Lists not being used by business logic',
      icon: Eye,
      recordCount: 0,
    },
    {
      id: 'recently-deleted',
      name: 'Recently Deleted',
      type: 'platform',
      provider: 'system',
      description: 'Lists deleted in the last 90 days',
      icon: Eye,
      recordCount: 0,
    },
  ];

  if (objectType === 'contacts') return contactViews;
  if (objectType === 'companies') return companyViews;
  if (objectType === 'list' || objectType === 'lists') return listViews;
  return companyViews;
};

export function ViewsManager({
  views,
  activeViewId,
  onViewChange,
  onSaveView,
  onEditView,
  maxViews = 50,
  currentViewCount = 0,
  objectType,
}: ViewsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');

  // Combine platform views with user views
  const platformViews = getDefaultPlatformViews(objectType);
  const allViews = [...platformViews, ...views];

  // Filter views based on search
  const filteredViews = allViews.filter(view =>
    view.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    view.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group views by type
  const groupedViews = {
    platform: filteredViews.filter(v => v.type === 'platform'),
    organization: filteredViews.filter(v => v.type === 'organization'),
    personal: filteredViews.filter(v => v.type === 'personal'),
  };

  const handleSaveView = () => {
    if (viewName.trim()) {
      onSaveView(viewName.trim(), viewDescription.trim() || undefined);
      setViewName('');
      setViewDescription('');
      setIsSaveDialogOpen(false);
    }
  };

  const handleViewSelect = (viewId: string) => {
    onViewChange(viewId);
    setIsOpen(false);
  };

  const ViewItem = ({ view }: { view: ViewDefinition }) => {
    const Icon = view.icon || Eye;
    
    return (
      <div
        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer rounded-md"
        onClick={() => handleViewSelect(view.id)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{view.name}</span>
              {view.provider === 'hubspot' && (
                <Badge variant="outline" className="text-xs">
                  HubSpot
                </Badge>
              )}
            </div>
            {view.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {view.description}
              </p>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {view.recordCount !== undefined && `${view.recordCount} records`}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="text-blue-600 h-8 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add view ({currentViewCount}/{maxViews})
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <div className="flex flex-col max-h-[480px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Choose a view</h3>
                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Save className="h-3 w-3 mr-1" />
                      Save as view
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Save current filters as view</DialogTitle>
                      <DialogDescription>
                        Create a custom view with your current filter settings.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="view-name">View name</Label>
                        <Input
                          id="view-name"
                          placeholder="My custom view"
                          value={viewName}
                          onChange={(e) => setViewName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="view-description">Description (optional)</Label>
                        <Input
                          id="view-description"
                          placeholder="Describe what this view shows..."
                          value={viewDescription}
                          onChange={(e) => setViewDescription(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveView} disabled={!viewName.trim()}>
                          Save view
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search views..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Platform Provided Views */}
              {groupedViews.platform.length > 0 && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Platform Provided ({groupedViews.platform.length})
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {groupedViews.platform.map((view) => (
                      <ViewItem key={view.id} view={view} />
                    ))}
                  </div>
                </div>
              )}

              {/* Organization Views */}
              {groupedViews.organization.length > 0 && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Organization Views ({groupedViews.organization.length})
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {groupedViews.organization.map((view) => (
                      <ViewItem key={view.id} view={view} />
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Views */}
              {groupedViews.personal.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      My Views ({groupedViews.personal.length})
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {groupedViews.personal.map((view) => (
                      <ViewItem key={view.id} view={view} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredViews.length === 0 && (
                <div className="p-8 text-center">
                  <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No views found matching your search' : 'No custom views created yet'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setIsSaveDialogOpen(true)}
                    >
                      Create your first view
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="sm" className="text-blue-600 h-8 text-xs">
        All views
      </Button>
    </div>
  );
}