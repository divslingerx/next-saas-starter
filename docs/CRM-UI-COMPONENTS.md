# CRM UI Components to Extract

Based on reviewing the CRM example, here are the key UI components and pages we should bring over to our platform. These are all shadcn/ui based and will integrate well with our existing setup.

## 🎯 Priority 1: Core Platform Components

These are the essential HubSpot-style components that form the foundation of our CRM/platform UI:

### 1. **PlatformTable** (`platform/PlatformTable.tsx`)
- Advanced data table with sorting, filtering, pagination
- Bulk selection and actions
- Column visibility controls
- Export functionality
- Infinite scroll support

### 2. **PlatformFilters** (`platform/PlatformFilters.tsx`)
- Advanced filter builder with AND/OR logic
- Support for multiple field types (text, number, date, select)
- Filter groups and conditions
- Save/load filter presets
- Real-time filter preview

### 3. **PlatformForm** (`platform/PlatformForm.tsx`)
- Dynamic form builder based on field definitions
- Multi-section forms with collapsible sections
- All field types (text, email, phone, URL, date, select, etc.)
- Validation with Zod
- Create/Edit modes

### 4. **ViewsManager** (`platform/ViewsManager.tsx`)
- Save custom table views with filters, columns, sorting
- Default views per object type
- Share views across team
- Quick view switcher

### 5. **AdvancedFiltersSidebar** (`platform/AdvancedFiltersSidebar.tsx`)
- Slide-out filter panel
- Complex filter logic builder
- Property-based filtering
- Date range pickers
- Saved filter templates

## 🎯 Priority 2: Dashboard & Analytics

### 6. **ObjectDashboard** components
- `ObjectDashboardRoot.tsx` - Main dashboard container
- `ObjectDashboardHeader.tsx` - Title, actions, date range
- `ObjectDashboardStatsCards.tsx` - KPI cards with trends
- `ObjectDashboardTable.tsx` - Summary data tables
- `ObjectDashboardFilters.tsx` - Quick filter controls

### 7. **ObjectStatsCards** (`platform/ObjectStatsCards.tsx`)
- Metric cards with icons
- Trend indicators (up/down percentages)
- Click-through to detailed views
- Real-time updates

## 🎯 Priority 3: Specialized Views

### 8. **KanbanBoard** (`kanban/KanbanBoard.tsx`)
- Drag-and-drop pipeline view for deals
- Stage columns with counts and values
- Card preview with key details
- Quick actions on cards
- Stage progression rules

### 9. **ContactsTable** (`platform/ContactsTable.tsx`)
- Specialized table for person/contact records
- Avatar display
- Quick email/phone actions
- Company associations
- Activity timeline preview

### 10. **ListsTable** (`platform/ListsTable.tsx`)
- Smart/static list management
- List size and usage tracking
- Folder organization
- Bulk list operations

## 🎯 Priority 4: Forms & Modals

### 11. **CSV Import** (`csv-import/csv-import.tsx`)
- Multi-step import wizard
- Column mapping interface
- Data preview and validation
- Duplicate handling options
- Import history

### 12. **ColumnVisibilityModal** (`platform/ColumnVisibilityModal.tsx`)
- Manage visible table columns
- Drag to reorder columns
- Save column preferences
- Reset to defaults

### 13. **PlatformDetailView** (`platform/PlatformDetailView.tsx`)
- Record detail sidebar/modal
- Tabbed sections (Overview, Activity, Related)
- Inline editing
- Activity timeline
- Related records

## 📁 Recommended File Structure

```
/apps/web/src/components/
├── crm/
│   ├── tables/
│   │   ├── platform-table.tsx
│   │   ├── contacts-table.tsx
│   │   ├── lists-table.tsx
│   │   └── table-columns.tsx
│   ├── filters/
│   │   ├── platform-filters.tsx
│   │   ├── advanced-filters-sidebar.tsx
│   │   └── filter-presets.tsx
│   ├── forms/
│   │   ├── platform-form.tsx
│   │   ├── contact-form.tsx
│   │   ├── deal-form.tsx
│   │   └── field-components/
│   ├── views/
│   │   ├── views-manager.tsx
│   │   ├── kanban-board.tsx
│   │   └── detail-view.tsx
│   ├── dashboard/
│   │   ├── dashboard-root.tsx
│   │   ├── stats-cards.tsx
│   │   ├── activity-feed.tsx
│   │   └── charts/
│   └── import/
│       ├── csv-import.tsx
│       └── import-mapping.tsx
```

## 🎨 Key Features to Implement

### 1. **Flexible Object System**
- Use our platform objects for custom fields
- Dynamic form generation from object definitions
- Property-based filtering and sorting

### 2. **Multi-Object Support**
- Contacts (Person)
- Companies (Organization)  
- Deals
- Tickets
- Custom objects

### 3. **View Persistence**
- Save view preferences per user
- Default views per object type
- Shareable team views

### 4. **Bulk Operations**
- Multi-select with checkboxes
- Bulk edit properties
- Bulk delete/archive
- Bulk assign/tag

### 5. **Real-time Updates**
- Use tRPC subscriptions for live data
- Optimistic updates
- Activity feed updates

## 🔧 Integration Points

### With Our Existing Stack:
1. **tRPC API** - All data fetching through our routers
2. **Platform Services** - Use our service layer for business logic
3. **Drizzle ORM** - Direct database queries where needed
4. **Better Auth** - User context and permissions
5. **Tailwind v4** - Consistent styling

### Required shadcn/ui Components:
Most are already in our UI package, but ensure we have:
- DataTable (with tanstack/table)
- Sheet (for sidebars)
- Command (for search)
- Calendar/DatePicker
- Multi-select components

## 📋 Implementation Order

1. **Week 1**: Core tables and filters
   - PlatformTable with basic features
   - PlatformFilters with common operators
   - Basic CRUD operations

2. **Week 2**: Forms and views
   - PlatformForm with validation
   - ViewsManager for saving preferences
   - Detail view sidebar

3. **Week 3**: Dashboard and analytics
   - Stats cards and metrics
   - Dashboard layout
   - Basic charts

4. **Week 4**: Specialized features
   - Kanban board for deals
   - CSV import wizard
   - Bulk operations

## 🚀 Quick Wins

These components will give immediate value:

1. **PlatformTable** - Instantly useful for any data display
2. **PlatformFilters** - Powerful searching across all objects
3. **PlatformForm** - Consistent forms everywhere
4. **StatsCards** - Quick metrics visualization
5. **ViewsManager** - User productivity boost

## 💡 Additional Considerations

### Performance:
- Virtual scrolling for large datasets
- Lazy loading for related data
- Debounced search/filter inputs
- Optimistic UI updates

### Accessibility:
- Keyboard navigation in tables
- Screen reader support
- Focus management in modals
- ARIA labels for actions

### Mobile:
- Responsive table layouts
- Touch-friendly controls
- Simplified mobile views
- Swipe actions where appropriate

### Customization:
- Themeable components
- Configurable columns
- Custom field renderers
- Extensible actions

This gives us a production-ready CRM UI that matches modern standards set by HubSpot, Salesforce, and similar platforms!