import { useState, useMemo } from "react";
import { Button } from "@tmcdm/ui/components/ui/button";
import { Label } from "@tmcdm/ui/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@tmcdm/ui/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tmcdm/ui/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@tmcdm/ui/components/ui/sheet";
import { ScrollArea } from "@tmcdm/ui/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tmcdm/ui/components/ui/tabs";
import { Switch } from "@tmcdm/ui/components/ui/switch";
import { Input } from "@tmcdm/ui/components/ui/input";
import { Separator } from "@tmcdm/ui/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tmcdm/ui/components/ui/select";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@tmcdm/ui/lib/utils";

interface ColumnMappingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  csvHeaders: string[];
}

// HubSpot property options for mapping
const propertyOptions = [
  "Do Not Import",
  // Contact Properties
  "First Name",
  "Last Name",
  "Full Name",
  "Email Address",
  "Contact Email",
  "Work Email",
  "Phone Number",
  "Mobile Phone",
  "Work Phone",
  "Company Name",
  "Job Title",
  "Department",
  "Address",
  "City",
  "State/Province",
  "Postal Code",
  "Country",
  "Website",
  "LinkedIn URL",
  "Lead Status",
  "Contact Owner",

  // Company Properties
  "Company Domain",
  "Industry",
  "Number of Employees",
  "Annual Revenue",
  "Company Type",
  "Founded Year",
  "Company Description",

  // Deal Properties
  "Deal Name",
  "Deal Stage",
  "Deal Amount",
  "Close Date",
  "Deal Type",
  "Pipeline",
  "Probability",
  "Deal Owner",

  // Custom Properties
  "Custom Field 1",
  "Custom Field 2",
  "Custom Field 3",
  "Notes",
  "Tags",
  "Source",
  "Campaign",
];

export function ColumnMappingSidebar({
  isOpen,
  onClose,
  csvHeaders,
}: ColumnMappingSidebarProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>(
    {}
  );
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [duplicateCheckColumns, setDuplicateCheckColumns] = useState<
    Record<string, boolean>
  >({});
  const [mergeColumns, setMergeColumns] = useState<Record<string, boolean>>({});
  const [duplicateFilter, setDuplicateFilter] = useState("");
  const [mergeFilter, setMergeFilter] = useState("");
  const [mapFilter, setMapFilter] = useState("");
  const [mergeDelimiter, setMergeDelimiter] = useState(";");

  // Get actual CSV headers to map
  const columnsToMap = useMemo(() => {
    return csvHeaders || [];
  }, [csvHeaders]);

  const handleMappingChange = (column: string, property: string) => {
    setMappings((prev) => ({
      ...prev,
      [column]: property,
    }));
  };

  const toggleCombobox = (column: string, isOpen: boolean) => {
    setOpenComboboxes((prev) => ({
      ...prev,
      [column]: isOpen,
    }));
  };

  const handleSave = () => {
    console.log("Saving mappings:", mappings);
    console.log("Remove Duplicates:", removeDuplicates);
    console.log("Duplicate Check Columns:", duplicateCheckColumns);
    console.log("Merge Columns:", mergeColumns);
    console.log("Merge Delimiter:", mergeDelimiter);
    // Here you would typically save the mappings to your backend or state management
    // This could be used to transform the CSV data before sending to HubSpot
    onClose();
  };

  const handleReset = () => {
    setMappings({});
  };

  const handleAutoMap = () => {
    // Try to automatically map columns based on name similarity
    const newMappings: Record<string, string> = {};

    columnsToMap.forEach((column) => {
      const columnLower = column.toLowerCase().replace(/[_\-\s]/g, "");

      const bestMatch = propertyOptions.find((option) => {
        if (option === "Do Not Import") return false;
        const optionLower = option.toLowerCase().replace(/[_\-\s]/g, "");
        return (
          optionLower === columnLower ||
          optionLower.includes(columnLower) ||
          columnLower.includes(optionLower)
        );
      });

      if (bestMatch) {
        newMappings[column] = bestMatch;
      }
    });

    setMappings(newMappings);
  };

  const handleMergeColumnToggle = (column: string, checked: boolean) => {
    setMergeColumns((prev) => ({
      ...prev,
      [column]: checked,
    }));
  };

  const handleDuplicateCheckToggle = (column: string, checked: boolean) => {
    setDuplicateCheckColumns((prev) => ({
      ...prev,
      [column]: checked,
    }));
  };

  const filteredDuplicateHeaders = useMemo(() => {
    return columnsToMap.filter((header) =>
      header.toLowerCase().includes(duplicateFilter.toLowerCase())
    );
  }, [columnsToMap, duplicateFilter]);

  const filteredMergeHeaders = useMemo(() => {
    return columnsToMap.filter((header) =>
      header.toLowerCase().includes(mergeFilter.toLowerCase())
    );
  }, [columnsToMap, mergeFilter]);

  const filteredMapHeaders = useMemo(() => {
    return columnsToMap.filter((header) =>
      header.toLowerCase().includes(mapFilter.toLowerCase())
    );
  }, [columnsToMap, mapFilter]);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-[400px] sm:w-[540px] bg-background">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Configure CSV Import</SheetTitle>
          <SheetDescription>
            Set up merge rules and map columns to HubSpot properties
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="merge" className="mt-6 px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="merge">Merge</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>

          <TabsContent value="merge" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="remove-duplicates">Remove exact duplicates</Label>
              <Switch
                id="remove-duplicates"
                checked={removeDuplicates}
                onCheckedChange={setRemoveDuplicates}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Tabs defaultValue="duplicate" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="duplicate" className="text-xs">
                    If duplicate
                  </TabsTrigger>
                  <TabsTrigger value="merge" className="text-xs">
                    Merge these columns
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="duplicate" className="mt-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter columns..."
                      value={duplicateFilter}
                      onChange={(e) => setDuplicateFilter(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <ScrollArea className="h-[calc(100vh-480px)]">
                    <div className="space-y-2 pr-4">
                      {filteredDuplicateHeaders.map((header) => (
                        <div
                          key={header}
                          className="flex items-center justify-between py-2"
                        >
                          <Label
                            htmlFor={`duplicate-${header}`}
                            className="text-sm font-normal"
                          >
                            {header}
                          </Label>
                          <Switch
                            id={`duplicate-${header}`}
                            checked={duplicateCheckColumns[header] || false}
                            onCheckedChange={(checked) =>
                              handleDuplicateCheckToggle(header, checked)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="merge" className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium">Merge rows</h3>
                    <span className="text-sm text-muted-foreground">using</span>
                    <Select
                      value={mergeDelimiter}
                      onValueChange={setMergeDelimiter}
                    >
                      <SelectTrigger className=" h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=";">; (semicolon)</SelectItem>
                        <SelectItem value=",">, (comma)</SelectItem>
                        <SelectItem value="|">| (pipe)</SelectItem>
                        <SelectItem value="-">- (hyphen)</SelectItem>
                        <SelectItem value="_">_ (underscore)</SelectItem>
                        <SelectItem value=" "> (space)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter columns..."
                      value={mergeFilter}
                      onChange={(e) => setMergeFilter(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <ScrollArea className="h-[calc(100vh-520px)]">
                    <div className="space-y-2 pr-4">
                      {filteredMergeHeaders.map((header) => (
                        <div
                          key={header}
                          className="flex items-center justify-between py-2"
                        >
                          <Label
                            htmlFor={`merge-${header}`}
                            className="text-sm font-normal"
                          >
                            {header}
                          </Label>
                          <Switch
                            id={`merge-${header}`}
                            checked={mergeColumns[header] || false}
                            onCheckedChange={(checked) =>
                              handleMergeColumnToggle(header, checked)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <div>
              <Button
                onClick={handleAutoMap}
                variant="outline"
                className="w-full"
              >
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
                          className="w-full justify-between"
                        >
                          {mappings[column]
                            ? propertyOptions.find(
                                (option) => option === mappings[column]
                              )
                            : `Select HubSpot property...`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search properties..." />
                          <CommandList>
                            <CommandEmpty>No property found.</CommandEmpty>
                            <CommandGroup>
                              {propertyOptions.map((option) => (
                                <CommandItem
                                  key={option}
                                  value={option}
                                  onSelect={(currentValue) => {
                                    const selectedOption = propertyOptions.find(
                                      (opt) =>
                                        opt.toLowerCase() ===
                                        currentValue.toLowerCase()
                                    );
                                    if (selectedOption) {
                                      handleMappingChange(
                                        column,
                                        selectedOption === mappings[column]
                                          ? ""
                                          : selectedOption
                                      );
                                    }
                                    toggleCombobox(column, false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      mappings[column] === option
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {option}
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
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-3 px-6 pb-6 pt-4 border-t">
          <Button onClick={handleSave} className="w-full">
            Save Mappings
          </Button>
          <Button variant="outline" onClick={handleReset} className="w-full">
            Reset All
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
