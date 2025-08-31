"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Filter,
  X,
  Plus,
  Minus,
  Search,
  Calendar,
  ChevronDown,
} from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

export type FilterOperator = 
  | 'EQ' 
  | 'NEQ' 
  | 'GT' 
  | 'GTE' 
  | 'LT' 
  | 'LTE' 
  | 'CONTAINS_TOKEN' 
  | 'NOT_CONTAINS_TOKEN'
  | 'IN' 
  | 'NOT_IN'
  | 'HAS_PROPERTY'
  | 'NOT_HAS_PROPERTY'

export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: any
}

export interface FilterGroup {
  id: string
  filters: FilterCondition[]
}

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'
  options?: { label: string; value: any }[]
  operators?: FilterOperator[]
}

export interface PlatformFiltersProps {
  fields: FilterField[]
  filterGroups: FilterGroup[]
  onFiltersChange: (filterGroups: FilterGroup[]) => void
  onClear: () => void
  activeFiltersCount?: number
  showApplyButton?: boolean
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  'EQ': 'is equal to',
  'NEQ': 'is not equal to',
  'GT': 'is greater than',
  'GTE': 'is greater than or equal to',
  'LT': 'is less than',
  'LTE': 'is less than or equal to',
  'CONTAINS_TOKEN': 'contains',
  'NOT_CONTAINS_TOKEN': 'does not contain',
  'IN': 'is any of',
  'NOT_IN': 'is none of',
  'HAS_PROPERTY': 'has property',
  'NOT_HAS_PROPERTY': 'does not have property',
}

const DEFAULT_OPERATORS_BY_TYPE: Record<string, FilterOperator[]> = {
  text: ['EQ', 'NEQ', 'CONTAINS_TOKEN', 'NOT_CONTAINS_TOKEN', 'HAS_PROPERTY', 'NOT_HAS_PROPERTY'],
  number: ['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'HAS_PROPERTY', 'NOT_HAS_PROPERTY'],
  date: ['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'HAS_PROPERTY', 'NOT_HAS_PROPERTY'],
  select: ['EQ', 'NEQ', 'IN', 'NOT_IN', 'HAS_PROPERTY', 'NOT_HAS_PROPERTY'],
  multiselect: ['IN', 'NOT_IN', 'HAS_PROPERTY', 'NOT_HAS_PROPERTY'],
  boolean: ['EQ', 'NEQ'],
}

function FilterConditionEditor({
  condition,
  fields,
  onChange,
  onRemove,
}: {
  condition: FilterCondition
  fields: FilterField[]
  onChange: (condition: FilterCondition) => void
  onRemove: () => void
}) {
  const field = fields.find(f => f.key === condition.field)
  const availableOperators = field?.operators || DEFAULT_OPERATORS_BY_TYPE[field?.type || 'text']

  const handleFieldChange = (fieldKey: string) => {
    const newField = fields.find(f => f.key === fieldKey)
    const newOperators = newField?.operators || DEFAULT_OPERATORS_BY_TYPE[newField?.type || 'text']
    const operator = newOperators.includes(condition.operator) ? condition.operator : newOperators[0]
    
    onChange({
      field: fieldKey,
      operator,
      value: '',
    })
  }

  const renderValueInput = () => {
    if (!field) return null

    const needsValue = !['HAS_PROPERTY', 'NOT_HAS_PROPERTY'].includes(condition.operator)
    if (!needsValue) return null

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={String(condition.value)}
            onValueChange={(value) => onChange({ ...condition, value })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select value..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        // For IN/NOT_IN operations, we need multiple values
        if (['IN', 'NOT_IN'].includes(condition.operator)) {
          const values = Array.isArray(condition.value) ? condition.value : []
          
          return (
            <div className="w-[200px] space-y-2">
              <Select
                onValueChange={(value) => {
                  const newValues = [...values, value].filter((v, i, arr) => arr.indexOf(v) === i)
                  onChange({ ...condition, value: newValues })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add values..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.filter(option => !values.includes(option.value)).map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1">
                {values.map((value: any, index: number) => {
                  const option = field.options?.find(opt => opt.value === value)
                  return (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {option?.label || value}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => {
                          const newValues = values.filter((_, i) => i !== index)
                          onChange({ ...condition, value: newValues })
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )
        }
        break

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {condition.value ? format(new Date(condition.value), 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={condition.value ? new Date(condition.value) : undefined}
                onSelect={(date) => onChange({ ...condition, value: date?.toISOString().split('T')[0] })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )

      case 'number':
        return (
          <Input
            type="number"
            className="w-[200px]"
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: Number(e.target.value) })}
            placeholder="Enter number..."
          />
        )

      case 'boolean':
        return (
          <Select
            value={String(condition.value)}
            onValueChange={(value) => onChange({ ...condition, value: value === 'true' })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            className="w-[200px]"
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            placeholder="Enter value..."
          />
        )
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg bg-background">
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select field..." />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.key} value={field.key}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(operator) => onChange({ ...condition, operator: operator as FilterOperator })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((operator) => (
            <SelectItem key={operator} value={operator}>
              {OPERATOR_LABELS[operator]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {renderValueInput()}

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

function FilterGroupEditor({
  group,
  fields,
  onChange,
  onRemove,
  showRemove,
}: {
  group: FilterGroup
  fields: FilterField[]
  onChange: (group: FilterGroup) => void
  onRemove: () => void
  showRemove: boolean
}) {
  const addFilter = () => {
    const newFilter: FilterCondition = {
      field: fields[0]?.key || '',
      operator: 'EQ',
      value: '',
    }
    
    onChange({
      ...group,
      filters: [...group.filters, newFilter],
    })
  }

  const updateFilter = (index: number, filter: FilterCondition) => {
    const newFilters = [...group.filters]
    newFilters[index] = filter
    onChange({ ...group, filters: newFilters })
  }

  const removeFilter = (index: number) => {
    const newFilters = group.filters.filter((_, i) => i !== index)
    onChange({ ...group, filters: newFilters })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Filter Group</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {group.filters.length > 1 && "All conditions must match (AND)"}
            </span>
            {showRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {group.filters.map((filter, index) => (
          <div key={index}>
            <FilterConditionEditor
              condition={filter}
              fields={fields}
              onChange={(newFilter) => updateFilter(index, newFilter)}
              onRemove={() => removeFilter(index)}
            />
            {index < group.filters.length - 1 && (
              <div className="flex items-center justify-center py-2">
                <Badge variant="secondary" className="text-xs">AND</Badge>
              </div>
            )}
          </div>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={addFilter}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add condition
        </Button>
      </CardContent>
    </Card>
  )
}

export function PlatformFilters({
  fields,
  filterGroups,
  onFiltersChange,
  onClear,
  activeFiltersCount = 0,
  showApplyButton = true,
}: PlatformFiltersProps) {
  const [localFilterGroups, setLocalFilterGroups] = useState<FilterGroup[]>(filterGroups)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setLocalFilterGroups(filterGroups)
  }, [filterGroups])

  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: `group-${Date.now()}`,
      filters: [{
        field: fields[0]?.key || '',
        operator: 'EQ',
        value: '',
      }],
    }
    
    setLocalFilterGroups([...localFilterGroups, newGroup])
  }

  const updateFilterGroup = (index: number, group: FilterGroup) => {
    const newGroups = [...localFilterGroups]
    newGroups[index] = group
    setLocalFilterGroups(newGroups)
  }

  const removeFilterGroup = (index: number) => {
    const newGroups = localFilterGroups.filter((_, i) => i !== index)
    setLocalFilterGroups(newGroups)
  }

  const applyFilters = () => {
    const validGroups = localFilterGroups.filter(group => 
      group.filters.length > 0 && group.filters.every(filter => filter.field && filter.operator)
    )
    onFiltersChange(validGroups)
    setIsOpen(false)
  }

  const clearAllFilters = () => {
    setLocalFilterGroups([])
    onClear()
    setIsOpen(false)
  }

  // Ensure we have at least one group
  if (localFilterGroups.length === 0) {
    setLocalFilterGroups([{
      id: 'group-initial',
      filters: [],
    }])
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] max-w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Records</SheetTitle>
          <SheetDescription>
            Create filter groups to narrow down your results. Records matching any group will be shown (OR logic between groups).
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-4">
          {localFilterGroups.map((group, index) => (
            <div key={group.id}>
              <FilterGroupEditor
                group={group}
                fields={fields}
                onChange={(newGroup) => updateFilterGroup(index, newGroup)}
                onRemove={() => removeFilterGroup(index)}
                showRemove={localFilterGroups.length > 1}
              />
              {index < localFilterGroups.length - 1 && (
                <div className="flex items-center justify-center py-4">
                  <Badge variant="outline" className="bg-primary text-primary-foreground">
                    OR
                  </Badge>
                </div>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addFilterGroup}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add filter group
          </Button>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={clearAllFilters}>
            Clear all
          </Button>
          {showApplyButton && (
            <Button onClick={applyFilters}>
              Apply filters
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// Quick filter component for common filters
export function QuickFilters({
  onFilterChange,
}: {
  onFilterChange: (field: string, value: any) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={(value) => onFilterChange('lifecycle_stage', value)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Lifecycle Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="subscriber">Subscriber</SelectItem>
          <SelectItem value="lead">Lead</SelectItem>
          <SelectItem value="marketing_qualified_lead">Marketing Qualified Lead</SelectItem>
          <SelectItem value="sales_qualified_lead">Sales Qualified Lead</SelectItem>
          <SelectItem value="opportunity">Opportunity</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
          <SelectItem value="evangelist">Evangelist</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={(value) => onFilterChange('lead_status', value)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Lead Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="open_deal">Open Deal</SelectItem>
          <SelectItem value="unqualified">Unqualified</SelectItem>
          <SelectItem value="attempted_to_contact">Attempted to Contact</SelectItem>
          <SelectItem value="connected">Connected</SelectItem>
          <SelectItem value="bad_timing">Bad Timing</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}