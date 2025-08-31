# ADMIN-003: Dynamic Form Builder

## Epic

EPIC-003: Admin Interface

## Story

**As a** developer  
**I want** a reusable form system based on schemas  
**So that** I can quickly build consistent forms throughout the admin interface

## Background

While originally designed for plugin developers, a dynamic form system is still valuable for V1. It will speed up development of admin forms and ensure consistency across the interface.

## Current Status

✅ **Available Tools**:
- React Hook Form in the project
- Zod for validation
- shadcn/ui form components
- TypeScript for type safety

## Acceptance Criteria

### Form Generation
- [ ] Generate forms from Zod schemas
- [ ] Support all common field types
- [ ] Handle nested objects and arrays
- [ ] Conditional field rendering
- [ ] Field dependencies

### Field Types
- [ ] Text input (text, email, url, etc.)
- [ ] Textarea with character count
- [ ] Number input with min/max
- [ ] Select (single and multi)
- [ ] Checkbox and radio groups
- [ ] Date/time pickers
- [ ] File upload
- [ ] Rich text editor
- [ ] Custom field components

### Validation & UX
- [ ] Real-time validation
- [ ] Async validation support
- [ ] Clear error messages
- [ ] Loading states
- [ ] Dirty state tracking
- [ ] Unsaved changes warning

### Advanced Features
- [ ] Form layouts (single/two column)
- [ ] Sections and groups
- [ ] Repeatable fields (arrays)
- [ ] Autosave capability
- [ ] Form state persistence

## Technical Implementation

### Schema-Driven Forms
```typescript
// Define form schema
const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  status: z.enum(["active", "draft", "archived"]),
  variants: z.array(z.object({
    sku: z.string(),
    price: z.number(),
    inventory: z.number().int(),
  })),
});

// Use dynamic form
<DynamicForm
  schema={productSchema}
  onSubmit={handleSubmit}
  defaultValues={product}
  fields={{
    description: { component: "textarea", rows: 4 },
    status: { 
      component: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Draft", value: "draft" },
        { label: "Archived", value: "archived" },
      ]
    },
  }}
/>
```

### Custom Field Registry
```typescript
// Register custom fields
const fieldRegistry = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  select: SelectField,
  multiselect: MultiSelectField,
  checkbox: CheckboxField,
  date: DateField,
  file: FileUploadField,
  richtext: RichTextEditor,
  // Custom fields
  'product-variants': ProductVariantsField,
  'image-gallery': ImageGalleryField,
};
```

### Form Layouts
```typescript
// Layout configuration
<DynamicForm
  schema={schema}
  layout={[
    { fields: ['title', 'handle'], columns: 2 },
    { fields: ['description'], columns: 1 },
    { 
      section: 'Pricing',
      fields: ['price', 'compareAtPrice'],
      columns: 2,
    },
  ]}
/>
```

## Use Cases in V1
- Product creation/editing forms
- Collection management forms
- Customer information forms
- Order processing forms
- Settings and configuration forms
- Bulk edit forms

## Non-Functional Requirements
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Mobile responsive
- [ ] < 100ms field validation
- [ ] TypeScript type safety
- [ ] Minimal bundle size

## Dependencies
- ✅ React Hook Form
- ✅ Zod validation
- ✅ shadcn/ui components
- ADMIN-001: Admin Shell (for consistent styling)

## Definition of Done
- [ ] Form generator implemented
- [ ] All field types working
- [ ] Validation integrated
- [ ] Layout system complete
- [ ] Used in at least 3 admin forms
- [ ] Documentation written
- [ ] Accessibility tested

## Estimated Points

**Original**: 5 points  
**Updated**: 5 points (same complexity, different use case)

## Notes
- Start with basic fields, add complex ones as needed
- Consider using react-hook-form's DevTools in development
- Plan for server-side validation errors
- Build with reusability in mind for V2 plugins