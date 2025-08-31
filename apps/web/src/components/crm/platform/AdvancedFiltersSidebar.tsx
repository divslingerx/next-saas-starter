/**
 * Advanced Filters Sidebar Component
 * HubSpot-style filter builder with complex query logic
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { X, Plus, Trash2, MoreHorizontal } from 'lucide-react';

export interface FilterCondition {
  id: string;
  property: string;
  operator: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface AdvancedFilters {
  groups: FilterGroup[];
  logic: 'AND' | 'OR';
}

interface AdvancedFiltersSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  properties: Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number';
    options?: string[];
  }>;
  objectType: string;
}

const OPERATORS = {
  text: [
    { value: 'is_equal_to_any_of', label: 'is equal to any of' },
    { value: 'is_not_equal_to_any_of', label: 'is not equal to any of' },
    { value: 'contains_exactly', label: 'contains exactly' },
    { value: 'does_not_contain_exactly', label: 'doesn\'t contain exactly' },
    { value: 'is_known', label: 'is known' },
    { value: 'is_unknown', label: 'is unknown' },
  ],
  select: [
    { value: 'is_equal_to_any_of', label: 'is equal to any of' },
    { value: 'is_not_equal_to_any_of', label: 'is not equal to any of' },
    { value: 'is_known', label: 'is known' },
    { value: 'is_unknown', label: 'is unknown' },
  ],
  date: [
    { value: 'is_equal_to_any_of', label: 'is equal to any of' },
    { value: 'is_not_equal_to_any_of', label: 'is not equal to any of' },
    { value: 'is_after', label: 'is after' },
    { value: 'is_before', label: 'is before' },
    { value: 'is_between', label: 'is between' },
    { value: 'is_known', label: 'is known' },
    { value: 'is_unknown', label: 'is unknown' },
  ],
  number: [
    { value: 'is_equal_to_any_of', label: 'is equal to any of' },
    { value: 'is_not_equal_to_any_of', label: 'is not equal to any of' },
    { value: 'is_greater_than', label: 'is greater than' },
    { value: 'is_less_than', label: 'is less than' },
    { value: 'is_between', label: 'is between' },
    { value: 'is_known', label: 'is known' },
    { value: 'is_unknown', label: 'is unknown' },
  ],
};

export function AdvancedFiltersSidebar({
  open,
  onClose,
  filters,
  onFiltersChange,
  properties,
  objectType,
}: AdvancedFiltersSidebarProps) {
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  const addFilterGroup = useCallback(() => {
    const newGroup: FilterGroup = {
      id: generateId(),
      logic: 'AND',
      conditions: [{
        id: generateId(),
        property: properties[0]?.key || '',
        operator: 'is_equal_to_any_of',
        value: '',
      }],
    };

    onFiltersChange({
      ...filters,
      groups: [...filters.groups, newGroup],
    });
  }, [filters, onFiltersChange, properties]);

  const removeFilterGroup = useCallback((groupId: string) => {
    onFiltersChange({
      ...filters,
      groups: filters.groups.filter(g => g.id !== groupId),
    });
  }, [filters, onFiltersChange]);

  const updateGroupLogic = useCallback((groupId: string, logic: 'AND' | 'OR') => {
    onFiltersChange({
      ...filters,
      groups: filters.groups.map(g => 
        g.id === groupId ? { ...g, logic } : g
      ),
    });
  }, [filters, onFiltersChange]);

  const addCondition = useCallback((groupId: string) => {
    const newCondition: FilterCondition = {
      id: generateId(),
      property: properties[0]?.key || '',
      operator: 'is_equal_to_any_of',
      value: '',
    };

    onFiltersChange({
      ...filters,
      groups: filters.groups.map(g =>
        g.id === groupId 
          ? { ...g, conditions: [...g.conditions, newCondition] }
          : g
      ),
    });
  }, [filters, onFiltersChange, properties]);

  const removeCondition = useCallback((groupId: string, conditionId: string) => {
    onFiltersChange({
      ...filters,
      groups: filters.groups.map(g =>
        g.id === groupId
          ? { ...g, conditions: g.conditions.filter(c => c.id !== conditionId) }
          : g
      ).filter(g => g.conditions.length > 0), // Remove empty groups
    });
  }, [filters, onFiltersChange]);

  const updateCondition = useCallback((
    groupId: string,
    conditionId: string,
    updates: Partial<FilterCondition>
  ) => {
    onFiltersChange({
      ...filters,
      groups: filters.groups.map(g =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map(c =>
                c.id === conditionId ? { ...c, ...updates } : c
              ),
            }
          : g
      ),
    });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      groups: [],
      logic: 'AND',
    });
  }, [onFiltersChange]);

  const getPropertyType = (propertyKey: string) => {
    return properties.find(p => p.key === propertyKey)?.type || 'text';
  };

  const getOperators = (propertyType: string) => {
    return OPERATORS[propertyType as keyof typeof OPERATORS] || OPERATORS.text;
  };

  const activeFiltersCount = filters.groups.reduce((count, group) => {
    return count + group.conditions.filter(c => c.value.trim()).length;
  }, 0);

  const selectedGroup = selectedGroupId ? filters.groups.find(g => g.id === selectedGroupId) : null;
  const selectedCondition = selectedConditionId && selectedGroup 
    ? selectedGroup.conditions.find(c => c.id === selectedConditionId) 
    : null;

  // Auto-select first group/condition when opening
  useEffect(() => {
    if (open && filters.groups.length > 0) {
      if (!selectedGroupId) {
        setSelectedGroupId(filters.groups[0].id);
      }
      if (!selectedConditionId && filters.groups[0].conditions.length > 0) {
        setSelectedConditionId(filters.groups[0].conditions[0].id);
      }
    }
  }, [open, filters.groups, selectedGroupId, selectedConditionId]);

  const handleConditionClick = (groupId: string, conditionId: string) => {
    setSelectedGroupId(groupId);
    setSelectedConditionId(conditionId);
  };

  const getConditionSummary = (condition: FilterCondition) => {
    const property = properties.find(p => p.key === condition.property);
    const operators = getOperators(getPropertyType(condition.property));
    const operator = operators.find(op => op.value === condition.operator);
    
    return `${property?.label || condition.property} ${operator?.label || condition.operator}${condition.value ? ` ${condition.value}` : ''}`;
  };

  return (
    <>
      <style>{`
        .advanced-filters-sheet {
          width: 800px !important;
          max-width: 90vw !important;
        }
        .advanced-filters-sheet[data-state="open"] {
          width: 800px !important;
          max-width: 90vw !important;
        }
      `}</style>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent 
          className="p-0 advanced-filters-sheet"
        >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#5BA4D6] text-white">
            <h2 className="text-lg font-semibold">All Filters</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content - Two Column Layout */}
          <div className="flex-1 flex">
            {/* Left Column - Filter Groups */}
            <div className="w-[400px] border-r border-border flex flex-col">
              {/* Left Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Advanced Filters</h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAllFilters}
                      className="text-xs"
                    >
                      Discard
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-4 h-4 border-2 rounded-full border-muted-foreground animate-spin" />
                      Applying changes
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Groups List */}
              <div className="flex-1 overflow-y-auto p-4">
                {filters.groups.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">
                      No filters applied. Add filters to refine your {objectType} list.
                    </p>
                    <Button onClick={addFilterGroup} className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Add filter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filters.groups.map((group, groupIndex) => (
                      <div key={group.id} className="space-y-3">
                        {/* Group Header */}
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Group {groupIndex + 1}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-blue-600"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFilterGroup(group.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Conditions */}
                        <div className="space-y-2">
                          {group.conditions.map((condition, conditionIndex) => (
                            <div key={condition.id}>
                              {conditionIndex > 0 && (
                                <div className="flex items-center justify-center py-1">
                                  <Badge variant="outline" className="text-xs font-medium">
                                    {group.logic}
                                  </Badge>
                                </div>
                              )}
                              
                              <div 
                                className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                                  selectedConditionId === condition.id ? 'border-blue-500 bg-blue-50' : 'border-border'
                                }`}
                                onClick={() => handleConditionClick(group.id, condition.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {properties.find(p => p.key === condition.property)?.label || condition.property}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {getConditionSummary(condition)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeCondition(group.id, condition.id);
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Filter */}
                        <div className="flex items-center justify-center py-2">
                          <Badge variant="outline" className="text-xs font-medium">
                            {group.logic}
                          </Badge>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addCondition(group.id)}
                          className="w-full text-xs text-blue-600 hover:text-blue-700"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add filter
                        </Button>

                        {/* OR separator */}
                        {groupIndex < filters.groups.length - 1 && (
                          <div className="flex items-center justify-center py-4">
                            <div className="flex-1 border-t border-border"></div>
                            <Badge variant="outline" className="mx-4 text-xs font-medium">
                              OR
                            </Badge>
                            <div className="flex-1 border-t border-border"></div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Filter Group */}
                    {filters.groups.length > 0 && (
                      <>
                        <div className="flex items-center justify-center py-4">
                          <div className="flex-1 border-t border-border"></div>
                          <Badge variant="outline" className="mx-4 text-xs font-medium">
                            OR
                          </Badge>
                          <div className="flex-1 border-t border-border"></div>
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={addFilterGroup}
                          className="w-full text-xs text-blue-600 border-blue-200"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add filter group
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Filter Editor */}
            <div className="flex-1 flex flex-col">
              {selectedCondition ? (
                <>
                  {/* Right Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium">
                        {properties.find(p => p.key === selectedCondition.property)?.label || 'Filter'}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-blue-600"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Filter Editor */}
                  <div className="flex-1 p-4">
                    <div className="space-y-4">
                      {/* Property Select */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Property</Label>
                        <Select
                          value={selectedCondition.property}
                          onValueChange={(value) => {
                            if (selectedGroupId) {
                              updateCondition(selectedGroupId, selectedCondition.id, { 
                                property: value,
                                operator: getOperators(getPropertyType(value))[0].value
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map((prop) => (
                              <SelectItem key={prop.key} value={prop.key}>
                                {prop.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Operator Select */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Condition</Label>
                        <Select
                          value={selectedCondition.operator}
                          onValueChange={(value) => {
                            if (selectedGroupId) {
                              updateCondition(selectedGroupId, selectedCondition.id, { operator: value });
                            }
                          }}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getOperators(getPropertyType(selectedCondition.property)).map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value Input */}
                      {!['is_known', 'is_unknown'].includes(selectedCondition.operator) && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Value</Label>
                          {(() => {
                            const property = properties.find(p => p.key === selectedCondition.property);
                            
                            if (property?.type === 'select' && property.options) {
                              return (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {selectedCondition.value.split(',').filter(v => v.trim()).map((val, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {val.trim()}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                          onClick={() => {
                                            if (selectedGroupId) {
                                              const newValue = selectedCondition.value
                                                .split(',')
                                                .filter(v => v.trim() !== val.trim())
                                                .join(',');
                                              updateCondition(selectedGroupId, selectedCondition.id, { value: newValue });
                                            }
                                          }}
                                        >
                                          <X className="h-2 w-2" />
                                        </Button>
                                      </Badge>
                                    ))}
                                  </div>
                                  <Select
                                    value=""
                                    onValueChange={(value) => {
                                      if (selectedGroupId) {
                                        const currentValues = selectedCondition.value.split(',').filter(v => v.trim());
                                        if (!currentValues.includes(value)) {
                                          const newValue = [...currentValues, value].join(',');
                                          updateCondition(selectedGroupId, selectedCondition.id, { value: newValue });
                                        }
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-10">
                                      <SelectValue placeholder="Type to add a value to this filter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {property.options.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            }

                            return (
                              <Input
                                value={selectedCondition.value}
                                onChange={(e) => {
                                  if (selectedGroupId) {
                                    updateCondition(selectedGroupId, selectedCondition.id, { value: e.target.value });
                                  }
                                }}
                                placeholder="Type to add a value to this filter"
                                className="h-10"
                              />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p className="text-sm">Select a filter to edit</p>
                    <p className="text-xs mt-1">Choose a filter from the left panel to configure it</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}