import { useMemo } from "react";
import { Button } from "@tmcdm/ui/components/ui/button";
import { Label } from "@tmcdm/ui/components/ui/label";
import { Input } from "@tmcdm/ui/components/ui/input";
import { ScrollArea } from "@tmcdm/ui/components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@tmcdm/ui/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@tmcdm/ui/components/ui/popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@tmcdm/ui/lib/utils";

interface MapTabProps {
  columnsToMap: string[];
  mappings: Record<string, string>;
  openComboboxes: Record<string, boolean>;
  propertyOptions: Array<{
    value: string;
    label: string;
    description?: string;
    groupName?: string;
  }>;
  handleAutoMap: () => void;
  handleMappingChange: (column: string, property: string) => void;
  toggleCombobox: (column: string, isOpen: boolean) => void;
  mapFilter: string;
  setMapFilter: (value: string) => void;
  isLoadingProperties?: boolean;
}

export function MapTab({
  columnsToMap,
  mappings,
  openComboboxes,
  propertyOptions,
  handleAutoMap,
  handleMappingChange,
  toggleCombobox,
  mapFilter,
  setMapFilter,
  isLoadingProperties,
}: MapTabProps) {
  const filteredMapHeaders = useMemo(() => {
    return columnsToMap.filter(header =>
      header.toLowerCase().includes(mapFilter.toLowerCase())
    );
  }, [columnsToMap, mapFilter]);

  return (
    <>
      <div>
        <Button onClick={handleAutoMap} variant="outline" className="w-full">
          Auto-Map Columns
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter columns..."
          value={mapFilter}
          onChange={(e) => setMapFilter(e.target.value)}
          className="pl-8"
        />
      </div>

      <ScrollArea className="h-[calc(100vh-450px)]">
        <div className="space-y-6 pr-4">
          {filteredMapHeaders.map((column) => (
            <div key={column} className="space-y-2">
              <Label
                htmlFor={`mapping-${column}`}
                className="text-sm font-medium"
              >
                {column} Column
              </Label>
              <Popover
                open={openComboboxes[column] || false}
                onOpenChange={(isOpen) => toggleCombobox(column, isOpen)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openComboboxes[column] || false}
                    className="w-full justify-between text-left"
                  >
                    <div className="flex-1 truncate">
                      {mappings[column] ? (
                        <div className="flex items-baseline gap-2">
                          <span>
                            {propertyOptions.find(
                              (option) => option.value === mappings[column]
                            )?.label || mappings[column]}
                          </span>
                          {mappings[column] !== "Do Not Import" && (
                            <span className="text-xs text-muted-foreground">
                              ({mappings[column]})
                            </span>
                          )}
                        </div>
                      ) : (
                        `Select HubSpot property...`
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search properties..." />
                    <CommandList>
                      <CommandEmpty>No property found.</CommandEmpty>
                      <CommandGroup>
                        {propertyOptions.map((option, index) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            className={cn(
                              "py-2 px-2 cursor-pointer",
                              index > 0 && "border-t border-border/50"
                            )}
                            onSelect={(currentValue) => {
                              const selectedOption = propertyOptions.find(
                                (opt) =>
                                  opt.label.toLowerCase() ===
                                  currentValue.toLowerCase()
                              );
                              if (selectedOption) {
                                handleMappingChange(
                                  column,
                                  selectedOption.value === mappings[column]
                                    ? ""
                                    : selectedOption.value
                                );
                              }
                              toggleCombobox(column, false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                mappings[column] === option.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col gap-1 py-1 w-full">
                              <div className="flex items-baseline gap-2">
                                <span className="font-medium">{option.label}</span>
                                {option.value !== "Do Not Import" && (
                                  <span className="text-xs text-muted-foreground">
                                    ({option.value})
                                  </span>
                                )}
                              </div>
                              {option.description && (
                                <span className="text-xs text-muted-foreground line-clamp-2 max-w-[400px]">
                                  {option.description}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {mappings[column] && (
                <p className="text-xs text-muted-foreground">
                  Mapped to: {mappings[column]}
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}