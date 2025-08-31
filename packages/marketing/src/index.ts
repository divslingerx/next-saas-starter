/**
 * Marketing Package - Marketing automation and campaign management
 * 
 * Provides:
 * - Campaign management
 * - Customer segmentation
 * - Email marketing
 * - Marketing automation workflows
 * - Lead scoring and nurturing
 */

// Marketing schemas
export * from "./schemas/campaign";

// Marketing services
// export * from "./services/marketing.service";
// export * from "./services/campaign.service";
// export * from "./services/segment.service";

// Re-export core types that Marketing uses
export type {
  Person,
  Organization
} from "@charmlabs/platform";