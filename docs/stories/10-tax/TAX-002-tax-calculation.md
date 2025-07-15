# TAX-002: Tax Calculation Engine

## Story
**As a** developer  
**I want** accurate tax calculations  
**So that** orders have correct tax amounts

## Acceptance Criteria
- [ ] Calculate tax based on destination
- [ ] Support origin-based tax
- [ ] Handle tax exemptions
- [ ] Calculate compound taxes
- [ ] Tax rounding rules
- [ ] Integration with tax services
- [ ] Tax calculation caching

## Technical Notes
- Pluggable tax providers
- Support Avalara, TaxJar
- Include Canadian GST/PST
- EU VAT validation

## Dependencies
- TAX-001: Tax Zone Configuration

## Estimated Points
5