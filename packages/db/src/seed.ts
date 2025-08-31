#!/usr/bin/env tsx
/**
 * Platform Seed Script
 * Seeds the database with default object definitions, pipelines, and other essential data
 */

import { db } from "./client";
import { 
  objectDefinition, 
  pipeline, 
  pipelineStage,
  propertyDefinition 
} from "@charmlabs/platform";
import { eq, and } from "drizzle-orm";

// Default object definitions for the platform
const DEFAULT_OBJECTS = [
  {
    internalName: "contact",
    name: "Contact",
    singularName: "Contact", 
    pluralName: "Contacts",
    description: "Individual people and decision makers",
    icon: "user",
    color: "#3B82F6",
    isSystem: true,
    displayProperty: "email",
    searchableProperties: ["email", "firstName", "lastName", "phone"],
    features: {
      versioning: true,
      audit: true,
      workflow: true,
      customProperties: true,
      associations: true,
    },
  },
  {
    internalName: "company",
    name: "Company",
    singularName: "Company",
    pluralName: "Companies", 
    description: "Organizations and business entities",
    icon: "building",
    color: "#10B981",
    isSystem: true,
    displayProperty: "name",
    searchableProperties: ["name", "website", "industry"],
    features: {
      versioning: true,
      audit: true,
      workflow: true,
      customProperties: true,
      associations: true,
    },
  },
  {
    internalName: "deal",
    name: "Deal",
    singularName: "Deal",
    pluralName: "Deals",
    description: "Sales opportunities and revenue tracking",
    icon: "dollar-sign",
    color: "#F59E0B",
    isSystem: true,
    displayProperty: "title",
    searchableProperties: ["title", "amount"],
    hasPipeline: true,
    features: {
      versioning: true,
      audit: true,
      workflow: true,
      customProperties: true,
      associations: true,
      pipeline: true,
    },
  },
  {
    internalName: "ticket",
    name: "Ticket",
    singularName: "Ticket",
    pluralName: "Tickets",
    description: "Customer support and service requests",
    icon: "ticket",
    color: "#EF4444",
    isSystem: true,
    displayProperty: "subject",
    searchableProperties: ["subject", "description"],
    hasPipeline: true,
    features: {
      versioning: true,
      audit: true,
      workflow: true,
      customProperties: true,
      associations: true,
      pipeline: true,
    },
  },
];

// Default pipelines for deals and tickets
const DEFAULT_PIPELINES = [
  {
    name: "Sales Pipeline",
    slug: "sales-pipeline",
    description: "Default sales pipeline for managing deals",
    type: "sales",
    isDefault: true,
    icon: "trending-up",
    color: "#10B981",
    stages: [
      {
        name: "Prospecting",
        slug: "prospecting",
        type: "open",
        position: 0,
        probability: 10,
        description: "Initial contact and qualification",
        color: "#94A3B8",
        targetDays: 7,
      },
      {
        name: "Qualification",
        slug: "qualification",
        type: "open",
        position: 1,
        probability: 20,
        description: "Assessing needs and budget",
        color: "#64748B",
        targetDays: 14,
        requiredFields: ["amount", "closeDate"],
      },
      {
        name: "Proposal",
        slug: "proposal",
        type: "open",
        position: 2,
        probability: 50,
        description: "Proposal sent and under review",
        color: "#3B82F6",
        targetDays: 7,
        requiredFields: ["amount", "closeDate", "primaryPersonId"],
      },
      {
        name: "Negotiation",
        slug: "negotiation",
        type: "open",
        position: 3,
        probability: 75,
        description: "Negotiating terms and pricing",
        color: "#8B5CF6",
        targetDays: 7,
      },
      {
        name: "Closed Won",
        slug: "closed-won",
        type: "won",
        position: 4,
        probability: 100,
        description: "Deal successfully closed",
        color: "#10B981",
        isEditable: false,
      },
      {
        name: "Closed Lost",
        slug: "closed-lost",
        type: "lost",
        position: 5,
        probability: 0,
        description: "Deal lost or cancelled",
        color: "#EF4444",
        isEditable: false,
      },
    ],
  },
  {
    name: "Support Pipeline",
    slug: "support-pipeline",
    description: "Pipeline for managing support tickets",
    type: "support",
    isDefault: false,
    icon: "life-buoy",
    color: "#EF4444",
    stages: [
      {
        name: "New",
        slug: "new",
        type: "open",
        position: 0,
        probability: 0,
        description: "New ticket submitted",
        color: "#EF4444",
        targetDays: 0,
        maxDays: 1,
      },
      {
        name: "In Progress",
        slug: "in-progress",
        type: "open",
        position: 1,
        probability: 0,
        description: "Ticket being worked on",
        color: "#F59E0B",
        targetDays: 1,
        maxDays: 3,
      },
      {
        name: "Waiting on Customer",
        slug: "waiting-on-customer",
        type: "open",
        position: 2,
        probability: 0,
        description: "Waiting for customer response",
        color: "#8B5CF6",
        targetDays: 2,
      },
      {
        name: "Resolved",
        slug: "resolved",
        type: "won",
        position: 3,
        probability: 100,
        description: "Issue resolved",
        color: "#10B981",
      },
    ],
  },
];

/**
 * Seed object definitions
 */
async function seedObjectDefinitions(organizationId: number) {
  console.log("🌱 Seeding Object Definitions...");
  
  let created = 0;
  let updated = 0;
  
  for (const obj of DEFAULT_OBJECTS) {
    try {
      // Check if object definition already exists
      const existing = await db
        .select()
        .from(objectDefinition)
        .where(
          and(
            eq(objectDefinition.organizationId, organizationId),
            eq(objectDefinition.internalName, obj.internalName)
          )
        )
        .limit(1);
      
      const objectData = {
        organizationId,
        ...obj,
        schema: {},
        properties: {},
        requiredProperties: [],
        isActive: true,
      };
      
      if (existing.length > 0) {
        // Update existing
        await db
          .update(objectDefinition)
          .set({
            ...objectData,
            updatedAt: new Date(),
          })
          .where(eq(objectDefinition.id, existing[0].id));
        
        console.log(`  ✅ Updated ${obj.name}`);
        updated++;
      } else {
        // Create new
        await db.insert(objectDefinition).values(objectData);
        console.log(`  ✅ Created ${obj.name}`);
        created++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to process ${obj.name}:`, error);
    }
  }
  
  console.log(`  📊 Objects: Created ${created}, Updated ${updated}`);
}

/**
 * Seed pipelines and stages
 */
async function seedPipelines(organizationId: number) {
  console.log("\n🌱 Seeding Pipelines...");
  
  let pipelinesCreated = 0;
  let stagesCreated = 0;
  
  for (const pipelineData of DEFAULT_PIPELINES) {
    try {
      // Check if pipeline exists
      const existing = await db
        .select()
        .from(pipeline)
        .where(
          and(
            eq(pipeline.organizationId, organizationId),
            eq(pipeline.slug, pipelineData.slug)
          )
        )
        .limit(1);
      
      let pipelineId: number;
      
      if (existing.length > 0) {
        pipelineId = existing[0].id;
        console.log(`  ⚠️  Pipeline "${pipelineData.name}" already exists`);
      } else {
        // Create pipeline
        const { stages, ...pipelineInfo } = pipelineData;
        const [newPipeline] = await db
          .insert(pipeline)
          .values({
            organizationId,
            ...pipelineInfo,
            settings: {},
            permissions: {},
          })
          .returning({ id: pipeline.id });
        
        pipelineId = newPipeline.id;
        pipelinesCreated++;
        console.log(`  ✅ Created pipeline "${pipelineData.name}"`);
        
        // Create stages
        for (const stage of stages) {
          await db.insert(pipelineStage).values({
            pipelineId,
            ...stage,
            automations: {},
          });
          stagesCreated++;
        }
        console.log(`     Added ${stages.length} stages`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to process pipeline ${pipelineData.name}:`, error);
    }
  }
  
  console.log(`  📊 Pipelines: Created ${pipelinesCreated} with ${stagesCreated} stages`);
}

/**
 * Main seed function
 */
async function seed() {
  console.log("🚀 Platform Seed Script");
  console.log("=" .repeat(50));
  
  // For demo, we'll use organization ID 1
  // In production, this would be created during signup
  const organizationId = 1;
  
  try {
    await seedObjectDefinitions(organizationId);
    await seedPipelines(organizationId);
    
    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seed().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { seed, seedObjectDefinitions, seedPipelines };