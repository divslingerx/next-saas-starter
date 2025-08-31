'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone'
import { CsvImportTable } from './csv-import-table'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import Papa from 'papaparse'

interface ObjectProperty {
  name: string
  label: string
  type: string
  groupName: string
  isRequired: boolean
  description?: string
}

interface CsvImportProps {
  objectType: 'company' | 'contact' | 'deal' | 'lead' | 'ticket' | 'list'
  availableProperties: ObjectProperty[]
  onImport: (data: {
    csvFile: File
    headerMapping: Record<string, string | undefined>
    totalRows: number
  }) => void
  onFileUploaded?: (uploaded: boolean, fileData?: { file: File, headers: string[], totalRows: number }) => void
  showMappingSidebar?: boolean
  headerMapping?: Record<string, string | undefined>
  onHeaderMappingChange?: (mapping: Record<string, string | undefined>) => void
}

export function CsvImport({ 
  objectType, 
  availableProperties, 
  onImport, 
  onFileUploaded,
  showMappingSidebar = false,
  headerMapping: externalHeaderMapping,
  onHeaderMappingChange
}: CsvImportProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Import configuration state  
  const [internalHeaderMapping, setInternalHeaderMapping] = useState<Record<string, string | undefined>>({})
  
  // Use external mapping if provided, otherwise use internal
  const headerMapping = externalHeaderMapping || internalHeaderMapping
  const setHeaderMapping = onHeaderMappingChange || setInternalHeaderMapping

  const parseCSV = (file: File): Promise<{ headers: string[], data: Record<string, string>[] }> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(results.errors[0].message))
            return
          }
          
          if (!results.data || results.data.length === 0) {
            reject(new Error('CSV file contains no data'))
            return
          }

          const headers = results.meta.fields || []
          if (headers.length === 0) {
            reject(new Error('CSV file contains no headers'))
            return
          }

          resolve({
            headers,
            data: results.data as Record<string, string>[]
          })
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`))
        }
      })
    })
  }

  const handleFileUpload = async (files: File[]) => {
    setError(null)
    setIsProcessing(true)

    try {
      const file = files[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB')
      }

      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please upload a CSV file')
      }

      const parsed = await parseCSV(file)
      
      setCsvFile(file)
      setHeaders(parsed.headers)
      setCsvData(parsed.data)
      
      // Notify parent component that file was uploaded
      onFileUploaded?.(true, {
        file,
        headers: parsed.headers,
        totalRows: parsed.data.length
      })
      
      // Reset configuration when new file is uploaded
      if (onHeaderMappingChange) {
        onHeaderMappingChange({})
      } else {
        setInternalHeaderMapping({})
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file')
      setCsvFile(null)
      setHeaders([])
      setCsvData([])
      onFileUploaded?.(false)
    } finally {
      setIsProcessing(false)
    }
  }

  // Show first 10 rows for preview
  const previewData = useMemo(() => {
    return csvData.slice(0, 10)
  }, [csvData])

  const handleImport = () => {
    if (!csvFile) return
    
    onImport({
      csvFile,
      headerMapping,
      totalRows: csvData.length,
    })
  }

  const mappedCount = Object.values(headerMapping).filter(v => v).length
  const canImport = csvFile && mappedCount > 0

  return (
    <div className="h-full p-6 space-y-6 max-w-full overflow-hidden">
        {/* Upload Section - Only show if no CSV is uploaded */}
        {!csvFile && (
          <Card>
            <CardContent className="p-6">
              <Dropzone
                maxSize={5 * 1024 * 1024} // 5MB
                accept={{ 'text/csv': ['.csv'] }}
                onDrop={handleFileUpload}
                src={csvFile ? [csvFile] : undefined}
                className="min-h-[120px]"
              >
                <DropzoneEmptyState>
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="h-8 w-8 mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Upload a CSV file to import {objectType}s
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum file size: 5MB
                    </p>
                  </div>
                </DropzoneEmptyState>
                <DropzoneContent>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{csvFile?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {csvData.length} rows • {headers.length} columns
                      </p>
                    </div>
                  </div>
                </DropzoneContent>
              </Dropzone>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Processing State */}
        {isProcessing && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Processing CSV file...</AlertDescription>
          </Alert>
        )}

        {/* Data Preview */}
        {csvData.length > 0 && (
          <>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg max-w-full">
                <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-lg font-medium truncate">{csvFile?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {csvData.length} rows • {headers.length} columns
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between max-w-full">
                <div className="min-w-0 flex-1">
                  <h4 className="text-md font-medium">Preview</h4>
                  <p className="text-sm text-muted-foreground">
                    {showMappingSidebar ? 'Configure column mapping in the sidebar' : 'Map CSV columns to import data'}
                  </p>
                </div>
                {!showMappingSidebar && (
                  <Button 
                    onClick={handleImport} 
                    disabled={!canImport}
                    className="flex items-center space-x-2 flex-shrink-0 ml-4"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Import {csvData.length} rows</span>
                  </Button>
                )}
              </div>
              
              <div className="border rounded-md max-w-full">
                <ScrollArea className="h-96 w-full">
                  <div className="min-w-max">
                    <CsvImportTable 
                      data={previewData}
                      columns={headers}
                    />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </>
        )}
    </div>
  )
}