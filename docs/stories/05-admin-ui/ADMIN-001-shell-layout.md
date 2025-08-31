# ADMIN-001: Admin Dashboard Shell

## Epic

EPIC-003: Admin Interface

## Story

**As a** store administrator  
**I want** a modern, intuitive admin interface  
**So that** I can efficiently manage all aspects of my e-commerce store

## Background

The admin dashboard is where store owners spend most of their time. It needs to be fast, intuitive, and mobile-friendly. Without the plugin system, we can focus on a clean, purpose-built interface.

## Current Status

✅ **Available Resources**:
- shadcn/ui components in `/packages/ui`
- Tailwind CSS v4 configured
- Better Auth for admin authentication
- Dark mode support via shadcn

## Acceptance Criteria

### Layout Structure
- [ ] Responsive sidebar navigation
- [ ] Collapsible menu for more space
- [ ] Top header with search and user menu
- [ ] Breadcrumb navigation
- [ ] Mobile-optimized layout (bottom nav on mobile)

### Navigation System
- [ ] Hierarchical menu structure
- [ ] Active state indicators
- [ ] Quick actions menu
- [ ] Recently viewed items
- [ ] Keyboard navigation support

### Core Features
- [ ] Global search (products, orders, customers)
- [ ] Notification center with badges
- [ ] User menu with account settings
- [ ] Store switcher (for multi-store future)
- [ ] Help/documentation links

### UI/UX Requirements
- [ ] Dark mode toggle (system/light/dark)
- [ ] Responsive breakpoints (mobile/tablet/desktop)
- [ ] Loading states for all operations
- [ ] Error boundaries for stability
- [ ] Accessibility (WCAG 2.1 AA)

## Technical Implementation

### Layout Component Structure
```typescript
// apps/web/src/app/admin/layout.tsx
export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-auto">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Navigation Configuration
```typescript
// Define static menu structure
const adminNavigation = [
  {
    title: 'Dashboard',
    icon: HomeIcon,
    href: '/admin',
  },
  {
    title: 'Catalog',
    icon: PackageIcon,
    children: [
      { title: 'Products', href: '/admin/products' },
      { title: 'Collections', href: '/admin/collections' },
      { title: 'Categories', href: '/admin/categories' },
    ],
  },
  {
    title: 'Orders',
    icon: ShoppingCartIcon,
    href: '/admin/orders',
    badge: 'pendingOrderCount',
  },
  // ... more items
];
```

### Search Implementation
```typescript
// Global search with command palette
export function AdminSearch() {
  const [open, setOpen] = useState(false);
  
  // Ctrl/Cmd + K to open
  useHotkeys('cmd+k, ctrl+k', () => setOpen(true));
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search products, orders, customers..." />
      <CommandList>
        <CommandGroup heading="Products">
          {/* Search results */}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

## Non-Functional Requirements
- [ ] Page load < 500ms
- [ ] Smooth animations (60fps)
- [ ] Works offline (service worker)
- [ ] Responsive down to 320px width
- [ ] Keyboard accessible

## Dependencies
- ✅ UI component library (shadcn/ui)
- ✅ Authentication (Better Auth)
- AUTH-002: Permission system (for menu visibility)
- Notification system (PLAT-004)

## Definition of Done
- [ ] Layout components implemented
- [ ] Navigation system working
- [ ] Search functionality complete
- [ ] Mobile responsive design
- [ ] Dark mode working
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met

## Estimated Points

**Original**: 5 points  
**Updated**: 5 points (complexity similar without plugins)

## Notes
- No plugin menu injection needed for V1
- Focus on core e-commerce workflows
- Consider command palette pattern (Cmd+K)
- Plan for offline-first capabilities