import { z } from 'zod';
import type { ObjectDefinition } from '@charmlabs/platform';

/**
 * Deal-specific schemas and types
 * Built on top of platform's flexible object system
 */

// Deal stages enum
export const DEAL_STAGES = {
  QUALIFIED: 'qualified',
  MEETING_SCHEDULED: 'meeting_scheduled',
  PROPOSAL_SENT: 'proposal_sent',
  NEGOTIATION: 'negotiation',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
} as const;

export type DealStage = typeof DEAL_STAGES[keyof typeof DEAL_STAGES];

// Deal priority
export const DEAL_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type DealPriority = typeof DEAL_PRIORITY[keyof typeof DEAL_PRIORITY];

// Deal property schema
export const dealPropertiesSchema = z.object({
  name: z.string(),
  amount: z.number().optional(),
  stage: z.enum(Object.values(DEAL_STAGES) as [string, ...string[]]),
  probability: z.number().min(0).max(100).optional(),
  closeDate: z.date().optional(),
  priority: z.enum(Object.values(DEAL_PRIORITY) as [string, ...string[]]).optional(),
  source: z.string().optional(),
  description: z.string().optional(),
  nextStep: z.string().optional(),
  lostReason: z.string().optional(),
  wonReason: z.string().optional(),
  competitorName: z.string().optional(),
  productInterest: z.array(z.string()).optional(),
  contractValue: z.number().optional(),
  contractLength: z.number().optional(), // in months
  renewalDate: z.date().optional(),
});

export type DealProperties = z.infer<typeof dealPropertiesSchema>;

/**
 * Deal object definition for the platform
 */
export const DEAL_OBJECT_DEFINITION: Partial<ObjectDefinition> = {
  internalName: 'deal',
  displayName: 'Deal',
  pluralName: 'Deals',
  description: 'Sales opportunities and deals',
  icon: 'briefcase',
  color: '#10b981',
  
  // Deal-specific configuration
  hasPipeline: true,
  pipelineStages: {
    stages: [
      { id: 'qualified', label: 'Qualified', order: 1, probability: 20 },
      { id: 'meeting_scheduled', label: 'Meeting Scheduled', order: 2, probability: 40 },
      { id: 'proposal_sent', label: 'Proposal Sent', order: 3, probability: 60 },
      { id: 'negotiation', label: 'Negotiation', order: 4, probability: 80 },
      { id: 'closed_won', label: 'Closed Won', order: 5, probability: 100, isWon: true },
      { id: 'closed_lost', label: 'Closed Lost', order: 6, probability: 0, isLost: true },
    ]
  },
  
  // Properties configuration
  schema: dealPropertiesSchema.shape,
  requiredProperties: ['name', 'stage'],
  searchableProperties: ['name', 'description'],
  displayProperty: 'name',
  secondaryDisplayProperties: ['amount', 'stage'],
  
  // Features
  features: {
    versioning: true,
    audit: true,
    workflow: true,
    activities: true,
    tasks: true,
    notes: true,
    documents: true,
  },
  
  // Allowed associations
  allowedAssociations: {
    person: { label: 'Contacts', multiple: true },
    organization: { label: 'Company', multiple: false },
    quote: { label: 'Quotes', multiple: true },
    order: { label: 'Orders', multiple: true },
    task: { label: 'Tasks', multiple: true },
    meeting: { label: 'Meetings', multiple: true },
  },
};

// Deal creation input
export const createDealSchema = dealPropertiesSchema.partial().required({
  name: true,
  stage: true,
});

export type CreateDealInput = z.infer<typeof createDealSchema>;

// Deal update input
export const updateDealSchema = dealPropertiesSchema.partial();

export type UpdateDealInput = z.infer<typeof updateDealSchema>;