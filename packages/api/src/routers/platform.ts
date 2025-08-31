/**
 * Platform API Router
 * Handles flexible object operations
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PlatformService } from "@charmlabs/platform";
import { TRPCError } from "@trpc/server";

const createObjectSchema = z.object({
  objectType: z.string(),
  properties: z.record(z.any()),
});

const updateObjectSchema = z.object({
  id: z.number(),
  properties: z.record(z.any()),
});

const searchObjectsSchema = z.object({
  objectType: z.string().optional(),
  filters: z.array(z.object({
    property: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in']),
    value: z.any(),
  })).optional(),
  sort: z.object({
    property: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const platformRouter = createTRPCRouter({
  // Initialize default object definitions
  initializeDefaults: protectedProcedure
    .mutation(async ({ ctx }) => {
      const service = new PlatformService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      await service.initializeDefaults();
      
      return { success: true };
    }),

  // Create object
  createObject: protectedProcedure
    .input(createObjectSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new PlatformService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      try {
        const record = await service.create(input.objectType, input.properties);
        return record;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to create object',
        });
      }
    }),

  // Update object
  updateObject: protectedProcedure
    .input(updateObjectSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new PlatformService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      try {
        const record = await service.update(input.id, input.properties);
        if (!record) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Object not found',
          });
        }
        return record;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to update object',
        });
      }
    }),

  // Search objects
  searchObjects: protectedProcedure
    .input(searchObjectsSchema)
    .query(async ({ ctx, input }) => {
      const service = new PlatformService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const result = await service.search({
        objectType: input.objectType,
        filters: input.filters,
        sort: input.sort,
        page: input.page,
        limit: input.limit,
      });

      return result;
    }),

  // Delete object (soft delete)
  deleteObject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = new PlatformService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const success = await service.delete(input.id);
      
      if (!success) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Object not found',
        });
      }

      return { success };
    }),

  // Batch create
  batchCreate: protectedProcedure
    .input(z.object({
      objectType: z.string(),
      records: z.array(z.record(z.any())),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new PlatformService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const result = await service.batchCreate(input.objectType, input.records);
      return result;
    }),

  // Get custom properties
  getCustomProperties: protectedProcedure
    .input(z.object({ objectType: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = new PlatformService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const properties = await service.getCustomProperties(input.objectType);
      return properties;
    }),

  // Add custom property
  addCustomProperty: protectedProcedure
    .input(z.object({
      objectType: z.string(),
      property: z.object({
        name: z.string(),
        displayName: z.string(),
        type: z.string(),
        description: z.string().optional(),
        isRequired: z.boolean().optional(),
        isUnique: z.boolean().optional(),
        defaultValue: z.any().optional(),
        options: z.any().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new PlatformService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const property = await service.addCustomProperty(
        input.objectType,
        input.property
      );
      
      return property;
    }),
});