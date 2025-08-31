/**
 * Deal API Router
 * Handles sales pipeline and deal management
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { DealService } from "@charmlabs/platform/crm";
import { TRPCError } from "@trpc/server";

const createDealSchema = z.object({
  title: z.string().min(1),
  pipelineId: z.number(),
  stageId: z.number(),
  value: z.number().optional(),
  currency: z.string().default('USD'),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.date().optional(),
  contactId: z.number().optional(),
  companyId: z.number().optional(),
  ownerId: z.number().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

const updateDealSchema = createDealSchema.partial().extend({
  id: z.number(),
  status: z.enum(['open', 'won', 'lost']).optional(),
  lostReason: z.string().optional(),
  closedAt: z.date().optional(),
});

const searchDealsSchema = z.object({
  query: z.string().optional(),
  pipelineId: z.number().optional(),
  stageId: z.number().optional(),
  status: z.enum(['open', 'won', 'lost']).optional(),
  ownerId: z.number().optional(),
  contactId: z.number().optional(),
  companyId: z.number().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const createPipelineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  stages: z.array(z.object({
    name: z.string().min(1),
    order: z.number(),
    defaultProbability: z.number().min(0).max(100).optional(),
    color: z.string().optional(),
  })),
});

export const dealRouter = createTRPCRouter({
  // Create deal
  create: protectedProcedure
    .input(createDealSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      try {
        const deal = await service.create(input);
        return deal;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to create deal',
        });
      }
    }),

  // Update deal
  update: protectedProcedure
    .input(updateDealSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const { id, ...data } = input;

      try {
        const deal = await service.update(id, data);
        if (!deal) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Deal not found',
          });
        }
        return deal;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to update deal',
        });
      }
    }),

  // Get deal by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const deal = await service.getById(input.id);
      
      if (!deal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }

      return deal;
    }),

  // Search deals
  search: protectedProcedure
    .input(searchDealsSchema)
    .query(async ({ ctx, input }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const result = await service.search(input);
      return result;
    }),

  // Move stage
  moveStage: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      stageId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      try {
        const deal = await service.moveStage(input);
        return deal;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to move deal stage',
        });
      }
    }),

  // Mark as won
  markAsWon: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      actualValue: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      try {
        const deal = await service.markAsWon(input.dealId, input.actualValue);
        return deal;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to mark deal as won',
        });
      }
    }),

  // Mark as lost
  markAsLost: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      try {
        const deal = await service.markAsLost(input.dealId, input.reason);
        return deal;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to mark deal as lost',
        });
      }
    }),

  // Get metrics
  getMetrics: protectedProcedure
    .input(z.object({
      pipelineId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const metrics = await service.getMetrics(input);
      return metrics;
    }),

  // Get activities
  getActivities: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const activities = await service.getActivities(input.dealId, input.limit);
      return activities;
    }),

  // Create pipeline
  createPipeline: protectedProcedure
    .input(createPipelineSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      try {
        const pipeline = await service.createPipeline(input);
        return pipeline;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to create pipeline',
        });
      }
    }),

  // Get pipelines
  getPipelines: protectedProcedure
    .query(async ({ ctx }) => {
      const service = new DealService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const pipelines = await service.getPipelines();
      return pipelines;
    }),
});