# SHIP-001: Shipping Zone Configuration

## Story
**As a** store administrator  
**I want** to configure shipping zones  
**So that** I can offer location-based shipping

## Acceptance Criteria
- [ ] Create shipping zones
- [ ] Assign countries/regions to zones
- [ ] Postal code range support
- [ ] Zone priority ordering
- [ ] Zone activation/deactivation
- [ ] Default zone handling

## Technical Notes
- Implement as @core/shipping plugin
- Support overlapping zones
- Include address validation
- Cache zone lookups

## Dependencies
- ADMIN-003: Dynamic Form System

## Estimated Points
5