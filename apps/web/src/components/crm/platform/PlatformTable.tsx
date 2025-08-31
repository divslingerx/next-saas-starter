"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type Row,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Settings2,
  Trash2,
  Archive,
  Edit,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@tanstack/react-router";
import {
  PlatformFilters,
  QuickFilters,
  type FilterGroup,
  type FilterField,
} from "./PlatformFilters";
import { ColumnVisibilityModal } from "./ColumnVisibilityModal";

export interface PlatformRecord {
  id: number | string;
  properties: Record<string, any>;
  associations?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  archived?: boolean;
}

export interface PlatformTableColumn {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "phone"
    | "url"
    | "date"
    | "number"
    | "badge"
    | "custom";
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  render?: (value: any, record: PlatformRecord) => React.ReactNode;
}

export interface PlatformTableProps<T extends PlatformRecord = PlatformRecord> {
  data: T[];
  columns: PlatformTableColumn[];
  objectType: string;
  loading?: boolean;
  totalCount?: number;

  // Pagination
  pagination?: {
    pageSize: number;
    after?: string;
    hasMore?: boolean;
    onPageChange: (after?: string) => void;
    onPageSizeChange: (size: number) => void;
  };

  // Actions
  onCreateNew?: () => void;
  onEdit?: (record: T) => void;
  onDelete?: (records: T[]) => void;
  onArchive?: (records: T[]) => void;
  onExport?: (records: T[]) => void;

  // Filters
  filterFields?: FilterField[];
  activeFilterGroups?: FilterGroup[];
  activeFiltersCount?: number;
  onFiltersChange?: (filterGroups: FilterGroup[]) => void;
  onClearFilters?: () => void;
  enableQuickFilters?: boolean;

  // Selection
  enableSelection?: boolean;
  onSelectionChange?: (selectedRecords: T[]) => void;

  // Routing
  detailPathPattern?: string; // e.g., "/crm/clients/{id}"
}

function formatCellValue(
  value: any,
  type: PlatformTableColumn["type"],
  record: PlatformRecord,
  render?: (value: any, record: PlatformRecord) => React.ReactNode
): React.ReactNode {
  if (render) {
    return render(value, record);
  }

  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (type) {
    case "email":
      return (
        <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
          {value}
        </a>
      );
    case "phone":
      return (
        <a href={`tel:${value}`} className="text-blue-600 hover:underline">
          {value}
        </a>
      );
    case "url":
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {value}
        </a>
      );
    case "date":
      const date = new Date(value);
      return (
        <span title={date.toLocaleString()}>
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      );
    case "number":
      return typeof value === "number" ? value.toLocaleString() : value;
    case "badge":
      return (
        <Badge variant={value === "active" ? "default" : "secondary"}>
          {value}
        </Badge>
      );
    default:
      return String(value);
  }
}

export function PlatformTable<T extends PlatformRecord = PlatformRecord>({
  data,
  columns,
  objectType,
  loading = false,
  totalCount,
  pagination,
  onCreateNew,
  onEdit,
  onDelete,
  onArchive,
  onExport,
  filterFields = [],
  activeFilterGroups = [],
  activeFiltersCount = 0,
  onFiltersChange,
  onClearFilters,
  enableQuickFilters = false,
  enableSelection = true,
  onSelectionChange,
  detailPathPattern,
}: PlatformTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // Wrap state setters in useCallback to prevent infinite re-renders
  const handleSortingChange = useCallback((updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    setSorting(updaterOrValue);
  }, []);

  const handleColumnFiltersChange = useCallback((updaterOrValue: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
    setColumnFilters(updaterOrValue);
  }, []);

  const handleColumnVisibilityChange = useCallback((updaterOrValue: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
    setColumnVisibility(updaterOrValue);
  }, []);

  const handleRowSelectionChange = useCallback((updaterOrValue: any) => {
    setRowSelection(updaterOrValue);
  }, []);

  const handleGlobalFilterChange = useCallback((updaterOrValue: string | ((old: string) => string)) => {
    setGlobalFilter(updaterOrValue);
  }, []);

  // Column visibility modal handlers
  const handleColumnVisibilityToggle = useCallback((columnId: string, visible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: visible
    }));
  }, []);

  const handleColumnModalSave = useCallback(() => {
    // Modal save logic if needed (state is already updated in real-time)
  }, []);


  // Create TanStack Table columns
  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = [];

    // Selection column
    if (enableSelection) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      });
    }

    // Data columns
    columns.forEach((column) => {
      cols.push({
        id: column.key,
        accessorFn: (row) =>
          row.properties?.[column.key] ?? row[column.key as keyof T],
        header: column.label,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const cellContent = formatCellValue(
            value,
            column.type,
            row.original,
            column.render
          );

          // If we have a detail path pattern and this is the first data column, make it a link
          if (detailPathPattern && column === columns[0]) {
            const detailPath = detailPathPattern.replace(
              "{id}",
              String(row.original.id)
            );
            return (
              <Link to={detailPath} className="hover:underline font-medium">
                {cellContent}
              </Link>
            );
          }

          return cellContent;
        },
        enableSorting: column.sortable ?? true,
        enableHiding: true,
        size: column.width,
      });
    });

    // Actions column
    cols.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {detailPathPattern && (
              <DropdownMenuItem asChild>
                <Link
                  to={detailPathPattern.replace(
                    "{id}",
                    String(row.original.id)
                  )}
                >
                  View Details
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onArchive && (
              <DropdownMenuItem onClick={() => onArchive([row.original])}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete([row.original])}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 60,
    });

    return cols;
  }, [
    columns,
    enableSelection,
    onEdit,
    onArchive,
    onDelete,
    detailPathPattern,
  ]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: handleRowSelectionChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: pagination?.pageSize || 25,
      },
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedRecords = useMemo(() => 
    selectedRows.map((row) => row.original), 
    [selectedRows]
  );

  // Notify parent of selection changes - only when actually changed
  const prevSelectedRecordsRef = React.useRef<T[]>([]);
  React.useEffect(() => {
    if (onSelectionChange && selectedRecords.length !== prevSelectedRecordsRef.current.length) {
      prevSelectedRecordsRef.current = selectedRecords;
      onSelectionChange(selectedRecords);
    }
  }, [selectedRecords, onSelectionChange]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Global search */}
          <Input
            placeholder={`Search ${objectType}s...`}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />

          {/* Quick filters */}
          {enableQuickFilters && (
            <QuickFilters
              onFilterChange={(field, value) => {
                // Handle quick filter changes
                if (onFiltersChange) {
                  const quickFilterGroup: FilterGroup = {
                    id: "quick-filters",
                    filters: [
                      {
                        field,
                        operator: "EQ",
                        value,
                      },
                    ],
                  };
                  onFiltersChange([quickFilterGroup]);
                }
              }}
            />
          )}

          {/* Advanced filters */}
          {filterFields.length > 0 && onFiltersChange && (
            <PlatformFilters
              fields={filterFields}
              filterGroups={activeFilterGroups}
              onFiltersChange={onFiltersChange}
              onClear={onClearFilters || (() => {})}
              activeFiltersCount={activeFiltersCount}
            />
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Bulk actions */}
          {selectedRecords.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedRecords.length} selected
              </span>

              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport(selectedRecords)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}

              {onArchive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onArchive(selectedRecords)}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(selectedRecords)}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          )}

          {/* Column visibility */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsColumnModalOpen(true)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Columns
          </Button>

          {/* Create new button */}
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create {objectType}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  No {objectType}s found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            {selectedRecords.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected
            {totalCount && ` (${totalCount.toLocaleString()} total)`}
          </div>

          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={pagination.pageSize}
              onChange={(e) =>
                pagination.onPageSizeChange(Number(e.target.value))
              }
              className="h-8 w-[70px] border border-input bg-background px-3 py-1 text-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange()}
                disabled={!pagination.after}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange("next")}
                disabled={!pagination.hasMore}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Column visibility modal */}
      <ColumnVisibilityModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        columns={columns}
        visibleColumnIds={Object.entries(columnVisibility)
          .filter(([, visible]) => visible !== false)
          .map(([columnId]) => columnId)
          .concat(
            columns
              .map(col => col.key)
              .filter(key => columnVisibility[key] === undefined)
          )}
        onColumnVisibilityChange={handleColumnVisibilityToggle}
        onSave={handleColumnModalSave}
      />
    </div>
  );
}
