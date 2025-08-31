'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ObjectPropertyCombobox } from './object-property-combobox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

interface ObjectProperty {
  name: string
  label: string
  type: string
  groupName: string
  isRequired: boolean
  description?: string
}

interface HeaderMapping {
  [header: string]: string | undefined
}

interface MergeOptions {
  [header: string]: boolean
}

interface UniqueOptions {
  uniquePerRow: string[]
  uniqueGlobally: string[]
}

interface CsvImportSidebarProps {
  headers: string[]
  availableProperties: ObjectProperty[]
  headerMapping: HeaderMapping
  onHeaderMappingChange: (mapping: HeaderMapping) => void
  mergeOptions: MergeOptions
  onMergeOptionsChange: (options: MergeOptions) => void
  uniqueOptions: UniqueOptions
  onUniqueOptionsChange: (options: UniqueOptions) => void
  removeDuplicates: boolean
  onRemoveDuplicatesChange: (remove: boolean) => void
}

export function CsvImportSidebar({
  headers,
  availableProperties,
  headerMapping,
  onHeaderMappingChange,
  mergeOptions,
  onMergeOptionsChange,
  uniqueOptions,
  onUniqueOptionsChange,
  removeDuplicates,
  onRemoveDuplicatesChange,
}: CsvImportSidebarProps) {
  const handleHeaderMappingChange = (header: string, propertyName?: string) => {
    onHeaderMappingChange({
      ...headerMapping,
      [header]: propertyName,
    })
  }

  const handleMergeToggle = (header: string, enabled: boolean) => {
    onMergeOptionsChange({
      ...mergeOptions,
      [header]: enabled,
    })
  }

  const handleUniquePerRowToggle = (header: string, enabled: boolean) => {
    const newUniquePerRow = enabled
      ? [...uniqueOptions.uniquePerRow, header]
      : uniqueOptions.uniquePerRow.filter(h => h !== header)
    
    onUniqueOptionsChange({
      ...uniqueOptions,
      uniquePerRow: newUniquePerRow,
    })
  }

  const handleUniqueGloballyToggle = (header: string, enabled: boolean) => {
    const newUniqueGlobally = enabled
      ? [...uniqueOptions.uniqueGlobally, header]
      : uniqueOptions.uniqueGlobally.filter(h => h !== header)
    
    onUniqueOptionsChange({
      ...uniqueOptions,
      uniqueGlobally: newUniqueGlobally,
    })
  }

  const resetAllMappings = () => {
    onHeaderMappingChange({})
  }

  const resetAllMergeOptions = () => {
    onMergeOptionsChange({})
  }

  const resetAllUniqueOptions = () => {
    onUniqueOptionsChange({
      uniquePerRow: [],
      uniqueGlobally: [],
    })
  }

  const mappedHeaders = Object.entries(headerMapping).filter(([_, value]) => value).length

  return (
    <div className="w-96 border-l bg-muted/30">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Remove Duplicates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Data Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="remove-duplicates" className="text-sm font-medium">
                  Remove duplicate rows
                </Label>
                <Switch
                  id="remove-duplicates"
                  checked={removeDuplicates}
                  onCheckedChange={onRemoveDuplicatesChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Remove exact duplicate rows from the dataset before processing
              </p>
            </CardContent>
          </Card>

          {/* Header Mapping */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Header Mapping 
                  <Badge variant="secondary" className="ml-2">
                    {mappedHeaders}/{headers.length}
                  </Badge>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllMappings}
                  className="h-6 w-6 p-0"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Map CSV headers to object properties
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {headers.map((header, index) => (
                  <div key={header} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium truncate max-w-[100px]" title={header}>
                        {header}
                      </Label>
                      <Badge variant="outline" className="text-[10px] h-4">
                        Col {index + 1}
                      </Badge>
                    </div>
                    <ObjectPropertyCombobox
                      value={headerMapping[header]}
                      onValueChange={(value) => handleHeaderMappingChange(header, value)}
                      properties={availableProperties}
                      placeholder="Select property..."
                      className="w-full text-xs"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Merge Options */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Merge Duplicates
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllMergeOptions}
                  className="h-6 w-6 p-0"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Merge duplicate values using ";" delimiter
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {headers.map((header) => (
                  <div key={header} className="flex items-center justify-between">
                    <Label className="text-xs font-medium truncate max-w-[120px]" title={header}>
                      {header}
                    </Label>
                    <Switch
                      checked={mergeOptions[header] || false}
                      onCheckedChange={(checked) => handleMergeToggle(header, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Unique Value Options */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Unique Values
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllUniqueOptions}
                  className="h-6 w-6 p-0"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Remove duplicate values within cells or globally
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium">Unique per row</Label>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Remove duplicates within each cell
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {headers.map((header) => (
                      <div key={header} className="flex items-center justify-between">
                        <Label className="text-xs truncate max-w-[120px]" title={header}>
                          {header}
                        </Label>
                        <Switch
                          checked={uniqueOptions.uniquePerRow.includes(header)}
                          onCheckedChange={(checked) => handleUniquePerRowToggle(header, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs font-medium">Unique globally</Label>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Remove duplicates across entire column
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {headers.map((header) => (
                      <div key={header} className="flex items-center justify-between">
                        <Label className="text-xs truncate max-w-[120px]" title={header}>
                          {header}
                        </Label>
                        <Switch
                          checked={uniqueOptions.uniqueGlobally.includes(header)}
                          onCheckedChange={(checked) => handleUniqueGloballyToggle(header, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}