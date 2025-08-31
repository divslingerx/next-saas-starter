'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ObjectProperty {
  name: string
  label: string
  type: string
  groupName: string
  isRequired: boolean
  description?: string
}

interface ObjectPropertyComboboxProps {
  value?: string
  onValueChange: (value: string | undefined) => void
  properties: ObjectProperty[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ObjectPropertyCombobox({
  value,
  onValueChange,
  properties,
  placeholder = 'Select property...',
  className,
  disabled
}: ObjectPropertyComboboxProps) {
  const [open, setOpen] = useState(false)

  const selectedProperty = value ? properties.find(p => p.name === value) : undefined

  // Group properties by their groupName
  const groupedProperties = properties.reduce((acc, property) => {
    const group = property.groupName || 'Other'
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(property)
    return acc
  }, {} as Record<string, ObjectProperty[]>)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[200px] justify-between', className)}
          disabled={disabled}
        >
          {selectedProperty ? selectedProperty.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search properties..." />
          <CommandList>
            <CommandEmpty>No property found.</CommandEmpty>
            <CommandItem
              onSelect={() => {
                onValueChange(undefined)
                setOpen(false)
              }}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  !value ? 'opacity-100' : 'opacity-0'
                )}
              />
              None
            </CommandItem>
            {Object.entries(groupedProperties).map(([groupName, groupProperties]) => (
              <CommandGroup key={groupName} heading={groupName.replace(/_/g, ' ')}>
                {groupProperties.map((property) => (
                  <CommandItem
                    key={property.name}
                    value={`${property.label} ${property.name}`}
                    onSelect={() => {
                      onValueChange(property.name === value ? undefined : property.name)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === property.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{property.label}</span>
                      {property.description && (
                        <span className="text-xs text-muted-foreground">
                          {property.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}