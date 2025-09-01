import { useState, useMemo } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Trash2, Edit, Download } from "lucide-react";

import { Button } from "@tmcdm/ui/components/ui/button";
import { Checkbox } from "@tmcdm/ui/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tmcdm/ui/components/ui/dropdown-menu";
import { Input } from "@tmcdm/ui/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@tmcdm/ui/components/ui/table";
import { BulkEditModal } from "./bulk-edit";

interface DataTableProps {
  data: any[][];
  selectedRows?: number[];
  onSelectionChange?: (selectedRows: number[]) => void;
}

export function DataTable({ data: csvData }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  // Transform CSV data for the table
  const { headers, data } = useMemo(() => {
    if (!csvData || csvData.length === 0) return { headers: [], data: [] };
    
    const headers = csvData[0];
    const data = csvData.slice(1).map((row, index) => {
      const rowObj: any = { _rowIndex: index };
      if (headers) {
        headers.forEach((header, i) => {
          rowObj[header || `column_${i}`] = row[i] || "";
        });
      }
      return rowObj;
    });
    
    console.log("Transformed data:", { headers, dataLength: data.length, sampleRow: data[0] });
    return { headers, data };
  }, [csvData]);

  // Generate columns dynamically from CSV headers
  const columns: ColumnDef<any>[] = useMemo(() => {
    if (!headers || headers.length === 0) return [];
    
    console.log("Generating columns for headers:", headers);
    const cols: ColumnDef<any>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
      },
      {
        id: "rowNumber",
        header: "#",
        cell: ({ row }) => row.original._rowIndex + 1,
        enableSorting: false,
        enableHiding: false,
      },
    ];

    // Add columns for each CSV header
    headers.forEach((header) => {
      const columnId = header || `column_${headers.indexOf(header)}`;
      cols.push({
        accessorKey: columnId,
        header: ({ column }) => {
          return (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              {header}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const value = row.getValue(columnId);
          return <div className="max-w-[300px] truncate" title={value as string}>{value as string}</div>;
        },
      });
    });

    // Add actions column
    cols.push({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(JSON.stringify(row.original))}>
                Copy row data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });

    console.log("Generated columns:", cols.map(c => c.id || (c as any).accessorKey));
    return cols;
  }, [headers]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  // Apply global filter
  const handleFilterChange = (value: string) => {
    setFilterValue(value);
    // Apply filter to all columns
    table.getAllColumns().forEach(column => {
      if (column.id !== 'select' && column.id !== 'rowNumber' && column.id !== 'actions') {
        column.setFilterValue(value);
      }
    });
  };

  // Export data to CSV
  const handleExport = () => {
    // Get visible columns and rows
    const visibleColumns = table.getAllColumns()
      .filter(col => col.getIsVisible() && col.id !== 'select' && col.id !== 'actions' && col.id !== 'rowNumber');
    
    const rows = table.getFilteredRowModel().rows;
    
    // Build CSV content
    const csvHeaders = visibleColumns.map(col => col.id).join(',');
    const csvRows = rows.map(row => {
      return visibleColumns.map(col => {
        const value = row.getValue(col.id);
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter data..."
          value={filterValue}
          onChange={(event) => handleFilterChange(event.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          {selectedRowCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedRowCount} selected</span>
              {selectedRowCount > 1 && (
                <Button variant="outline" size="sm" onClick={() => setIsBulkEditOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>
              )}
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      <div className="rounded-md border overflow-auto max-h-[600px]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedCount={selectedRowCount}
        totalCount={data.length}
        onApply={(data, applyToAll) => {
          console.log('Bulk edit applied:', data, applyToAll);
          setIsBulkEditOpen(false);
        }}
      />
    </div>
  );
}