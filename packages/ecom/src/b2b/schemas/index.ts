// Export all consolidated schemas
export * from "./companies";
export * from "./price-lists";
export * from "./discounts";

// Re-export customerGroup and customerGroupMember from ecom-customer package
// to maintain compatibility (remove if not needed)
// export { 
//   customerGroup, 
//   customerGroupMember,
//   type CustomerGroup,
//   type NewCustomerGroup,
//   type CustomerGroupMember,
//   type NewCustomGroupMember,
//   insertCustomerGroupSchema,
//   selectCustomerGroupSchema,
//   insertCustomerGroupMemberSchema,
//   selectCustomerGroupMemberSchema
// } from "@charmlabs/ecom-customer/schemas/customer-group";