# B2B-001: Business Account Support

## Story

**As a** B2B customer  
**I want** business account features  
**So that** my team can manage orders together

## Acceptance Criteria

- [ ] Business account type on customer
- [ ] Multiple contacts per account
- [ ] Contact roles and permissions
- [ ] Payment terms configuration
- [ ] Credit limit management
- [ ] Tax exemption support
- [ ] Custom pricing tiers

## Technical Notes

- Extend customer_account with B2B fields
- Create customer_contact table
- Support NET payment terms
- Purchase order support

## Dependencies

- ECOM-005: Customer Management
- AUTH-001: Customer Account to Organization Bridge

## Estimated Points

8
