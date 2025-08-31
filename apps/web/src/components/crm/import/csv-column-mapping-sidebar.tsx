'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CheckCircle2 } from 'lucide-react'

interface ObjectProperty {
  name: string
  label: string
  type: string
  groupName: string
  isRequired: boolean
  description?: string
}

interface CsvColumnMappingSidebarProps {
  open: boolean
  onClose: () => void
  headers: string[]
  availableProperties: ObjectProperty[]
  headerMapping: Record<string, string | undefined>
  onHeaderMappingChange: (mapping: Record<string, string | undefined>) => void
  onImport: () => void
  canImport: boolean
  totalRows: number
  objectType: string
}

export function CsvColumnMappingSidebar({
  open,
  onClose,
  headers,
  availableProperties,
  headerMapping,
  onHeaderMappingChange,
  onImport,
  canImport,
  totalRows,
  objectType
}: CsvColumnMappingSidebarProps) {
  const mappedCount = Object.values(headerMapping).filter(v => v).length

  const handleHeaderMappingChange = (header: string, propertyName?: string) => {
    onHeaderMappingChange({
      ...headerMapping,
      [header]: propertyName,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <style>{`
          .csv-mapping-sheet {
            width: 600px !important;
            max-width: 90vw !important;
          }
        `}</style>
        
        <div className="p-6">
          <SheetHeader className="px-0 mb-6">
            <SheetTitle>Column Mapping</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-[calc(100vh-160px)]">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Map CSV columns to {objectType} properties. Skip columns you don't want to import.
              </p>
            </div>
            
            <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {headers.map((header, index) => (
                <div key={header} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium truncate max-w-[200px]" title={header}>
                      {header}
                    </Label>
                    <Badge variant="outline" className="text-xs h-5">
                      Column {index + 1}
                    </Badge>
                  </div>
                  <select
                    value={headerMapping[header] || ''}
                    onChange={(e) => handleHeaderMappingChange(header, e.target.value || undefined)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Skip column</option>
                    {availableProperties.map(prop => (
                      <option key={prop.name} value={prop.name}>
                        {prop.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </ScrollArea>
          
            <div className="pt-6 border-t mt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">{mappedCount}</span> of {headers.length} columns mapped
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      onImport()
                      onClose()
                    }} 
                    disabled={!canImport}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Import {totalRows} rows
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}