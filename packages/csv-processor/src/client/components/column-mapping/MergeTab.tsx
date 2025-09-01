import { useMemo } from "react";
import { Label } from "@tmcdm/ui/components/ui/label";
import { Switch } from "@tmcdm/ui/components/ui/switch";
import { Input } from "@tmcdm/ui/components/ui/input";
import { Separator } from "@tmcdm/ui/components/ui/separator";
import { ScrollArea } from "@tmcdm/ui/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@tmcdm/ui/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@tmcdm/ui/components/ui/select";
import { Search } from "lucide-react";

interface MergeTabProps {
  columnsToMap: string[];
  removeDuplicates: boolean;
  setRemoveDuplicates: (value: boolean) => void;
  duplicateCheckColumns: Record<string, boolean>;
  handleDuplicateCheckToggle: (column: string, checked: boolean) => void;
  mergeColumns: Record<string, boolean>;
  handleMergeColumnToggle: (column: string, checked: boolean) => void;
  mergeDelimiter: string;
  setMergeDelimiter: (value: string) => void;
  duplicateFilter: string;
  setDuplicateFilter: (value: string) => void;
  mergeFilter: string;
  setMergeFilter: (value: string) => void;
}

export function MergeTab({
  columnsToMap,
  removeDuplicates,
  setRemoveDuplicates,
  duplicateCheckColumns,
  handleDuplicateCheckToggle,
  mergeColumns,
  handleMergeColumnToggle,
  mergeDelimiter,
  setMergeDelimiter,
  duplicateFilter,
  setDuplicateFilter,
  mergeFilter,
  setMergeFilter,
}: MergeTabProps) {
  const filteredDuplicateHeaders = useMemo(() => {
    return columnsToMap.filter(header =>
      header.toLowerCase().includes(duplicateFilter.toLowerCase())
    );
  }, [columnsToMap, duplicateFilter]);

  const filteredMergeHeaders = useMemo(() => {
    return columnsToMap.filter(header =>
      header.toLowerCase().includes(mergeFilter.toLowerCase())
    );
  }, [columnsToMap, mergeFilter]);

  return (
    <>
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
    </>
  );
}