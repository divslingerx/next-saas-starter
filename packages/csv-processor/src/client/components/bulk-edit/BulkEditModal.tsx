import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@tmcdm/ui/components/ui/dialog";
import { Button } from "@tmcdm/ui/components/ui/button";
import { Label } from "@tmcdm/ui/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@tmcdm/ui/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@tmcdm/ui/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@tmcdm/ui/lib/utils";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  totalCount: number;
  onApply: (data: { pipeline: string; stage: string }, applyToAll: boolean) => void;
}

const pipelines = [
  { value: "sales", label: "Sales Pipeline" },
  { value: "marketing", label: "Marketing Pipeline" },
  { value: "support", label: "Support Pipeline" },
  { value: "onboarding", label: "Onboarding Pipeline" },
];

const pipelineStages = {
  sales: [
    { value: "prospect", label: "Prospect" },
    { value: "qualified", label: "Qualified" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "closed-won", label: "Closed Won" },
    { value: "closed-lost", label: "Closed Lost" },
  ],
  marketing: [
    { value: "lead", label: "Lead" },
    { value: "mql", label: "Marketing Qualified Lead" },
    { value: "sql", label: "Sales Qualified Lead" },
    { value: "opportunity", label: "Opportunity" },
    { value: "customer", label: "Customer" },
  ],
  support: [
    { value: "new", label: "New" },
    { value: "in-progress", label: "In Progress" },
    { value: "waiting", label: "Waiting on Customer" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ],
  onboarding: [
    { value: "not-started", label: "Not Started" },
    { value: "in-progress", label: "In Progress" },
    { value: "blocked", label: "Blocked" },
    { value: "completed", label: "Completed" },
  ],
};

export function BulkEditModal({ isOpen, onClose, selectedCount, totalCount, onApply }: BulkEditModalProps) {
  const [pipeline, setPipeline] = useState("");
  const [stage, setStage] = useState("");
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);

  // Reset stage when pipeline changes
  useEffect(() => {
    setStage("");
  }, [pipeline]);

  const handleApply = (applyToAll: boolean) => {
    if (!pipeline) return;
    
    onApply({ pipeline, stage }, applyToAll);
    handleClose();
  };

  const handleClose = () => {
    setPipeline("");
    setStage("");
    onClose();
  };

  const availableStages = pipeline ? pipelineStages[pipeline as keyof typeof pipelineStages] : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Edit Records</DialogTitle>
          <DialogDescription>
            Update pipeline and stage for {selectedCount} selected record{selectedCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pipeline">Pipeline</Label>
            <Popover open={pipelineOpen} onOpenChange={setPipelineOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={pipelineOpen}
                  className="w-full justify-between"
                >
                  {pipeline
                    ? pipelines.find((p) => p.value === pipeline)?.label
                    : "Select pipeline..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search pipelines..." />
                  <CommandList>
                    <CommandEmpty>No pipeline found.</CommandEmpty>
                    <CommandGroup>
                      {pipelines.map((p) => (
                        <CommandItem
                          key={p.value}
                          value={p.value}
                          onSelect={(currentValue) => {
                            setPipeline(currentValue === pipeline ? "" : currentValue);
                            setPipelineOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              pipeline === p.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {p.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage" className={!pipeline ? "text-muted-foreground" : ""}>
              Pipeline Stage
            </Label>
            <Popover open={stageOpen} onOpenChange={setStageOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={stageOpen}
                  disabled={!pipeline}
                  className="w-full justify-between"
                >
                  {stage
                    ? availableStages.find((s) => s.value === stage)?.label
                    : pipeline ? "Select stage..." : "Select a pipeline first"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search stages..." />
                  <CommandList>
                    <CommandEmpty>No stage found.</CommandEmpty>
                    <CommandGroup>
                      {availableStages.map((s) => (
                        <CommandItem
                          key={s.value}
                          value={s.value}
                          onSelect={(currentValue) => {
                            setStage(currentValue === stage ? "" : currentValue);
                            setStageOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              stage === s.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {s.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="sm:mr-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleApply(false)}
            disabled={!pipeline}
          >
            Apply to Selected ({selectedCount})
          </Button>
          <Button
            onClick={() => handleApply(true)}
            disabled={!pipeline}
          >
            Apply to All ({totalCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}