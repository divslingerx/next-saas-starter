# ADMIN-002: UI Extension Points

## Story
**As a** plugin developer  
**I want** defined UI extension points  
**So that** plugins can add UI components

## Acceptance Criteria
- [ ] Extension point component
- [ ] Menu injection system
- [ ] Page section extensions
- [ ] Widget system
- [ ] Tab injection
- [ ] Action button injection
- [ ] Modal/drawer system

## Technical Notes
```typescript
<ExtensionPoint 
  id="product.edit.tabs" 
  context={{ product }}
/>

// Plugin registers:
adminUI: {
  extensions: {
    'product.edit.tabs': ProductReviewsTab
  }
}
```

## Dependencies
- ADMIN-001: Admin Shell Layout

## Estimated Points
5