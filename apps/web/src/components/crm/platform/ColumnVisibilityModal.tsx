"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Search, X, GripVertical } from "lucide-react";
import type { PlatformTableColumn } from "./PlatformTable";

interface ColumnInfo {
  id: string;
  key: string;
  label: string;
  description?: string;
  type: string;
  isVisible: boolean;
  canHide: boolean;
}

interface ColumnVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: PlatformTableColumn[];
  visibleColumnIds: string[];
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  onSave: () => void;
}

export function ColumnVisibilityModal({
  isOpen,
  onClose,
  columns,
  visibleColumnIds,
  onColumnVisibilityChange,
  onSave,
}: ColumnVisibilityModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Transform columns into column info with visibility state
  const columnInfos = useMemo<ColumnInfo[]>(() => {
    return columns.map((col) => ({
      id: col.key,
      key: col.key,
      label: col.label,
      description: getColumnDescription(col.key, col.type),
      type: col.type,
      isVisible: visibleColumnIds.includes(col.key),
      canHide: col.key !== 'select', // Don't allow hiding the selection column
    }));
  }, [columns, visibleColumnIds]);

  // Filter columns based on search
  const filteredColumns = useMemo(() => {
    if (!searchQuery) return columnInfos;
    
    return columnInfos.filter((col) =>
      col.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [columnInfos, searchQuery]);

  // Split into available and visible columns
  const availableColumns = useMemo(() => 
    filteredColumns.filter(col => !col.isVisible && col.canHide),
    [filteredColumns]
  );

  const visibleColumns = useMemo(() => 
    filteredColumns.filter(col => col.isVisible),
    [filteredColumns]
  );

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    onColumnVisibilityChange(columnId, visible);
  };

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Customize Columns</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose which columns to display in your table. Toggle columns on to add them to the visible columns list.
          </p>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Split panel */}
          <div className="grid grid-cols-2 gap-6 min-h-[400px]">
            {/* Available columns (left panel) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Available Columns</h3>
                <Badge variant="secondary">{availableColumns.length}</Badge>
              </div>
              
              <div className="border rounded-md p-3 bg-muted/30 max-h-[350px] overflow-y-auto space-y-2">
                {availableColumns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {searchQuery ? "No columns match your search" : "All available columns are visible"}
                  </p>
                ) : (
                  availableColumns.map((column) => (
                    <div
                      key={column.id}
                      className="flex items-center justify-between p-3 bg-background rounded border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{column.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {column.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {column.key}
                        </div>
                        {column.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {column.description}
                          </div>
                        )}
                      </div>
                      <Switch
                        checked={false}
                        onCheckedChange={() => handleToggleColumn(column.id, true)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Visible columns (right panel) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Visible Columns</h3>
                <Badge variant="default">{visibleColumns.length}</Badge>
              </div>
              
              <div className="border rounded-md p-3 bg-primary/5 max-h-[350px] overflow-y-auto space-y-2">
                {visibleColumns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No columns selected
                  </p>
                ) : (
                  visibleColumns.map((column) => (
                    <div
                      key={column.id}
                      className="flex items-center justify-between p-3 bg-background rounded border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{column.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {column.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {column.key}
                          </div>
                          {column.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {column.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {column.canHide && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleColumn(column.id, false)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to provide descriptions for common column types
function getColumnDescription(key: string, type: string): string {
  const descriptions: Record<string, string> = {
    name: "The primary name or title of the record",
    email: "Email address for contact information",
    phone: "Phone number for contact information", 
    company: "Company or organization name",
    website: "Website URL or domain",
    lifecycle_stage: "Current stage in the sales/marketing funnel",
    lead_status: "Current status of the lead or opportunity",
    city: "City location",
    state: "State or province location",
    country: "Country location",
    revenue: "Annual revenue or deal value",
    employeeCount: "Number of employees",
    industry: "Business industry or sector",
    created_at: "Date and time when the record was created",
    updated_at: "Date and time when the record was last modified",
  };

  return descriptions[key] || `${type} field containing ${key.replace(/_/g, ' ')} information`;
}