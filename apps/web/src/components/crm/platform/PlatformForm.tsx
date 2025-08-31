"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { CalendarIcon, Loader2, Save, X } from "lucide-react"
import { format } from "date-fns"

export interface FormField {
  key: string
  label: string
  type: 'text' | 'email' | 'phone' | 'url' | 'number' | 'textarea' | 'select' | 'multiselect' | 'boolean' | 'date' | 'datetime'
  required?: boolean
  placeholder?: string
  description?: string
  options?: { label: string; value: any }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    customValidation?: (value: any) => string | undefined
  }
  section?: string
  width?: 'full' | 'half' | 'third'
  defaultValue?: any
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface PlatformFormProps {
  objectType: string
  fields?: FormField[]
  sections?: FormSection[]
  initialValues?: Record<string, any>
  onSubmit: (data: Record<string, any>) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  mode?: 'create' | 'edit'
  
  // Layout
  columns?: 1 | 2 | 3
  showSections?: boolean
}

function createValidationSchema(fields: FormField[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodType<any>> = {}
  
  fields.forEach(field => {
    let validator: z.ZodType<any>
    
    switch (field.type) {
      case 'email':
        validator = z.string().email('Invalid email address')
        break
      case 'url':
        validator = z.string().url('Invalid URL')
        break
      case 'phone':
        validator = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number')
        break
      case 'number':
        validator = z.number()
        if (field.validation?.min !== undefined) {
          validator = validator.min(field.validation.min)
        }
        if (field.validation?.max !== undefined) {
          validator = validator.max(field.validation.max)
        }
        break
      case 'date':
      case 'datetime':
        validator = z.date().optional()
        break
      case 'boolean':
        validator = z.boolean()
        break
      case 'multiselect':
        validator = z.array(z.any())
        break
      default:
        validator = z.string()
        if (field.validation?.pattern) {
          validator = validator.regex(new RegExp(field.validation.pattern))
        }
        if (field.validation?.min !== undefined) {
          validator = validator.min(field.validation.min)
        }
        if (field.validation?.max !== undefined) {
          validator = validator.max(field.validation.max)
        }
    }
    
    if (!field.required) {
      validator = validator.optional()
    }
    
    shape[field.key] = validator
  })
  
  return z.object(shape)
}

function FormFieldRenderer({ 
  field, 
  control,
  error 
}: { 
  field: FormField
  control: any
  error?: string
}) {
  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => (
        <FormItem className={cn(
          "space-y-2",
          field.width === 'half' && 'md:col-span-1',
          field.width === 'third' && 'md:col-span-1',
          field.width === 'full' && 'md:col-span-full'
        )}>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {(() => {
              switch (field.type) {
                case 'textarea':
                  return (
                    <Textarea
                      {...formField}
                      placeholder={field.placeholder}
                      className="min-h-[100px]"
                    />
                  )
                
                case 'select':
                  return (
                    <Select onValueChange={formField.onChange} value={formField.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
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
                  const values = Array.isArray(formField.value) ? formField.value : []
                  return (
                    <div className="space-y-2">
                      <Select
                        onValueChange={(value) => {
                          const newValues = [...values, value].filter((v, i, arr) => arr.indexOf(v) === i)
                          formField.onChange(newValues)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || `Add ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.filter(option => !values.includes(option.value)).map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value: any, index: number) => {
                          const option = field.options?.find(opt => opt.value === value)
                          return (
                            <div key={index} className="inline-flex items-center px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                              {option?.label || value}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-2"
                                onClick={() => {
                                  const newValues = values.filter((_, i) => i !== index)
                                  formField.onChange(newValues)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                
                case 'boolean':
                  return (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formField.value}
                        onCheckedChange={formField.onChange}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formField.value ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )
                
                case 'date':
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formField.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formField.value ? (
                            format(new Date(formField.value), 'PPP')
                          ) : (
                            <span>{field.placeholder || 'Pick a date'}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formField.value ? new Date(formField.value) : undefined}
                          onSelect={(date) => formField.onChange(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )
                
                case 'number':
                  return (
                    <Input
                      {...formField}
                      type="number"
                      placeholder={field.placeholder}
                      min={field.validation?.min}
                      max={field.validation?.max}
                      onChange={(e) => formField.onChange(Number(e.target.value))}
                    />
                  )
                
                default:
                  return (
                    <Input
                      {...formField}
                      type={field.type}
                      placeholder={field.placeholder}
                    />
                  )
              }
            })()}
          </FormControl>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function PlatformForm({
  objectType,
  fields = [],
  sections = [],
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
  columns = 2,
  showSections = true,
}: PlatformFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Flatten fields from sections if using sections mode
  const allFields = showSections && sections.length > 0 
    ? sections.flatMap(section => section.fields)
    : fields

  const validationSchema = createValidationSchema(allFields)
  
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      ...allFields.reduce((acc, field) => ({
        ...acc,
        [field.key]: field.defaultValue || (field.type === 'boolean' ? false : field.type === 'multiselect' ? [] : '')
      }), {}),
      ...initialValues,
    },
  })

  useEffect(() => {
    // Reset form with initial values when they change
    form.reset({
      ...allFields.reduce((acc, field) => ({
        ...acc,
        [field.key]: field.defaultValue || (field.type === 'boolean' ? false : field.type === 'multiselect' ? [] : '')
      }), {}),
      ...initialValues,
    })
  }, [initialValues, form, allFields])

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderFields = (fieldsToRender: FormField[]) => {
    const gridCols = columns === 3 ? 'grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1'
    
    return (
      <div className={cn("grid gap-6", `md:${gridCols}`)}>
        {fieldsToRender.map((field) => (
          <FormFieldRenderer
            key={field.key}
            field={field}
            control={form.control}
            error={form.formState.errors[field.key]?.message as string}
          />
        ))}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {showSections && sections.length > 0 ? (
          // Render sections
          sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                {section.description && (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {renderFields(section.fields)}
              </CardContent>
            </Card>
          ))
        ) : (
          // Render fields directly
          <Card>
            <CardHeader>
              <CardTitle>
                {mode === 'create' ? `Create New ${objectType}` : `Edit ${objectType}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderFields(allFields)}
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || loading}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? `Create ${objectType}` : `Save Changes`}
          </Button>
        </div>
      </form>
    </Form>
  )
}