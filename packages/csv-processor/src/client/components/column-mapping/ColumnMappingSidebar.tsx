import { useState, useMemo } from "react";
import { Button } from "@tmcdm/ui/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@tmcdm/ui/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@tmcdm/ui/components/ui/tabs";
import { MergeTab } from "./MergeTab";
import { MapTab } from "./MapTab";
import { useHubSpotProperties } from "../../hooks/useHubSpotProperties";
import { Loader2 } from "lucide-react";

interface ColumnMappingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  csvHeaders: string[];
  onProcess?: (config: any) => void;
}

export function ColumnMappingSidebar({
  isOpen,
  onClose,
  csvHeaders,
  onProcess,
}: ColumnMappingSidebarProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>({});
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [duplicateCheckColumns, setDuplicateCheckColumns] = useState<Record<string, boolean>>({});
  const [mergeColumns, setMergeColumns] = useState<Record<string, boolean>>({});
  const [duplicateFilter, setDuplicateFilter] = useState("");
  const [mergeFilter, setMergeFilter] = useState("");
  const [mapFilter, setMapFilter] = useState("");
  const [mergeDelimiter, setMergeDelimiter] = useState(";");

  // Fetch HubSpot deal properties
  const { data: hubspotProperties, isLoading: isLoadingProperties, error: propertiesError } = useHubSpotProperties("deals");

  // Get actual CSV headers to map
  const columnsToMap = useMemo(() => {
    return csvHeaders || [];
  }, [csvHeaders]);

  // Properties are already in the right format from the hook
  const propertyOptions = hubspotProperties || [];

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
    // Build processing configuration
    const processingConfig: any = {};
    
    // Add column mappings if any are set
    if (Object.keys(mappings).length > 0) {
      processingConfig.columnMappings = mappings;
    }
    
    // Add duplicate removal if enabled
    if (removeDuplicates) {
      processingConfig.removeDuplicates = true;
      const selectedColumns = Object.entries(duplicateCheckColumns)
        .filter(([_, checked]) => checked)
        .map(([column]) => column);
      if (selectedColumns.length > 0) {
        processingConfig.duplicateCheckColumns = selectedColumns;
      }
    }
    
    // Add column merging if any columns are selected
    const selectedMergeColumns = Object.entries(mergeColumns)
      .filter(([_, checked]) => checked)
      .map(([column]) => column);
    if (selectedMergeColumns.length > 0) {
      processingConfig.mergeColumns = selectedMergeColumns;
      processingConfig.mergeDelimiter = mergeDelimiter;
    }
    
    console.log("Processing config:", processingConfig);
    
    // Trigger processing if handler is provided
    if (onProcess) {
      onProcess(processingConfig);
    }
    
    onClose();
  };

  const handleReset = () => {
    setMappings({});
  };

  const handleAutoMap = () => {
    if (!hubspotProperties) return;
    
    // Try to automatically map columns based on name similarity
    const newMappings: Record<string, string> = {};

    columnsToMap.forEach((column) => {
      const columnLower = column.toLowerCase().replace(/[_\-\s]/g, "");

      const bestMatch = hubspotProperties.find((prop) => {
        if (prop.value === "Do Not Import") return false;
        
        // Check both the property name and label for matches
        const propNameLower = prop.value.toLowerCase().replace(/[_\-\s]/g, "");
        const propLabelLower = prop.label.toLowerCase().replace(/[_\-\s]/g, "");
        
        return (
          propNameLower === columnLower ||
          propLabelLower === columnLower ||
          propNameLower.includes(columnLower) ||
          propLabelLower.includes(columnLower) ||
          columnLower.includes(propNameLower) ||
          columnLower.includes(propLabelLower)
        );
      });

      if (bestMatch) {
        // Use the property name (value) not the label for the actual mapping
        newMappings[column] = bestMatch.value;
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
            {isLoadingProperties ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading HubSpot deal properties...
              </span>
            ) : propertiesError ? (
              <div className="text-red-500">
                <div>Failed to load HubSpot properties</div>
                <div className="text-xs mt-1">
                  {propertiesError instanceof Error ? propertiesError.message : "Unknown error"}
                </div>
              </div>
            ) : (
              "Set up merge rules and map columns to HubSpot deal properties"
            )}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="merge" className="mt-6 px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="merge">Merge</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>

          <TabsContent value="merge" className="space-y-4">
            <MergeTab
              columnsToMap={columnsToMap}
              removeDuplicates={removeDuplicates}
              setRemoveDuplicates={setRemoveDuplicates}
              duplicateCheckColumns={duplicateCheckColumns}
              handleDuplicateCheckToggle={handleDuplicateCheckToggle}
              mergeColumns={mergeColumns}
              handleMergeColumnToggle={handleMergeColumnToggle}
              mergeDelimiter={mergeDelimiter}
              setMergeDelimiter={setMergeDelimiter}
              duplicateFilter={duplicateFilter}
              setDuplicateFilter={setDuplicateFilter}
              mergeFilter={mergeFilter}
              setMergeFilter={setMergeFilter}
            />
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <MapTab
              columnsToMap={columnsToMap}
              mappings={mappings}
              openComboboxes={openComboboxes}
              propertyOptions={propertyOptions}
              handleAutoMap={handleAutoMap}
              handleMappingChange={handleMappingChange}
              toggleCombobox={toggleCombobox}
              mapFilter={mapFilter}
              setMapFilter={setMapFilter}
              isLoadingProperties={isLoadingProperties}
            />
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-3 px-6 pb-6 pt-4 border-t">
          <Button onClick={handleSave} className="w-full">
            Process File
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