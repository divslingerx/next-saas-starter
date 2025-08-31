# ADMIN-004: Data Table Component System

## Epic

EPIC-003: Admin Interface

## Story

**As a** store administrator  
**I want** powerful, consistent data tables throughout the admin  
**So that** I can efficiently view, filter, and manage large datasets

## Background

Data tables are central to the admin experience. Products, orders, customers - all need robust table functionality. A reusable system will ensure consistency and save development time.

## Current Status

✅ **Available Tools**:
- TanStack Table v8 (recommended)
- shadcn/ui table components
- Server-side data via tRPC
- React Query for caching

## Acceptance Criteria

### Core Features
- [ ] Sortable columns (multi-column sort)
- [ ] Column filtering (text, number, date, select)
- [ ] Global search across all columns
- [ ] Column visibility toggle
- [ ] Column resizing
- [ ] Row selection (single and multi)
- [ ] Pagination (client and server-side)
- [ ] Configurable page sizes

### Advanced Features
- [ ] Bulk actions on selected rows
- [ ] Inline editing capability
- [ ] Expandable rows for details
- [ ] Sticky header on scroll
- [ ] Horizontal scroll for many columns
- [ ] Export functionality (CSV, Excel)
- [ ] Saved views/filters per user
- [ ] Keyboard navigation

### Mobile Experience
- [ ] Responsive design
- [ ] Touch-friendly controls
- [ ] Swipe actions on rows
- [ ] Condensed mobile view
- [ ] Priority column display

## Technical Implementation

### Table Configuration
```typescript
// Reusable table component
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchable?: boolean;
  selectable?: boolean;
  actions?: BulkAction<T>[];
  onRowClick?: (row: T) => void;
  serverSide?: ServerSideConfig;
}

// Usage example
<DataTable
  data={products}
  columns={productColumns}
  searchable
  selectable
  actions={[
    {
      label: 'Archive',
      action: (rows) => archiveProducts(rows),
      confirmation: true,
    },
  ]}
  serverSide={{
    total: totalProducts,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onFiltersChange: setFilters,
  }}
/>
```

### Column Definitions
```typescript
const productColumns: ColumnDef<Product>[] = [
  {
    id: 'select',
    header: ({ table }) => <Checkbox {...table.getToggleAllProps()} />,
    cell: ({ row }) => <Checkbox {...row.getToggleSelectedProps()} />,
  },
  {
    accessorKey: 'title',
    header: 'Product',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img src={row.original.image} className="w-10 h-10" />
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-sm text-muted">{row.original.sku}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ getValue }) => formatCurrency(getValue()),
    filterFn: 'inNumberRange',
  },
  {
    accessorKey: 'inventory',
    header: 'Stock',
    cell: ({ getValue }) => (
      <Badge variant={getValue() > 0 ? 'default' : 'destructive'}>
        {getValue()}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
];
```

### Server-Side Integration
```typescript
// tRPC query with table state
const { data, isLoading } = api.products.list.useQuery({
  pagination: {
    pageIndex: table.getState().pagination.pageIndex,
    pageSize: table.getState().pagination.pageSize,
  },
  sorting: table.getState().sorting,
  filters: table.getState().columnFilters,
  globalFilter: table.getState().globalFilter,
});
```

### Mobile Optimization
```typescript
// Responsive column visibility
const mobileColumns = ['title', 'price', 'status'];
const desktopColumns = [...mobileColumns, 'inventory', 'category', 'updatedAt'];

// Swipe actions for mobile
<SwipeableRow
  onSwipeLeft={() => handleEdit(row)}
  onSwipeRight={() => handleDelete(row)}
>
  {row.cells}
</SwipeableRow>
```

## Use Cases
- Product list with inventory
- Order management table
- Customer database
- Inventory adjustments
- Transaction history
- Analytics data

## Non-Functional Requirements
- [ ] Handle 10k+ rows efficiently
- [ ] < 100ms sort/filter operations
- [ ] Smooth scrolling (60fps)
- [ ] Accessible (keyboard nav, screen readers)
- [ ] Works offline with cached data

## Dependencies
- ✅ UI components (shadcn/ui)
- ✅ Data fetching (tRPC + React Query)
- ADMIN-001: Admin Shell (for layout)
- API layer for server-side operations

## Definition of Done
- [ ] Core table component built
- [ ] All features implemented
- [ ] Mobile responsive
- [ ] Used in 3+ admin pages
- [ ] Performance tested with large datasets
- [ ] Accessibility audit passed
- [ ] Documentation with examples

## Estimated Points

**Original**: 5 points  
**Updated**: 5 points (complexity unchanged)

## Notes
- Consider virtualization for very large datasets
- Build with server-side in mind from start
- Plan for real-time updates (websockets)
- Export should handle large datasets efficiently