/**
 * Person API Router
 * Handles unified identity management
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PersonService } from "@charmlabs/platform";
import { TRPCError } from "@trpc/server";

const createPersonSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  isCustomer: z.boolean().optional(),
  isLead: z.boolean().optional(),
  isContact: z.boolean().optional(),
  isVendor: z.boolean().optional(),
  isPartner: z.boolean().optional(),
  isEmployee: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  organizationId: z.number().optional(),
  organizationRole: z.string().optional(),
});

const updatePersonSchema = createPersonSchema.partial().extend({
  id: z.number(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

const searchPersonSchema = z.object({
  query: z.string().optional(),
  roles: z.array(z.enum(['customer', 'lead', 'contact', 'vendor', 'partner', 'employee'])).optional(),
  organizationId: z.number().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const personRouter = createTRPCRouter({
  // Create person
  create: protectedProcedure
    .input(createPersonSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      try {
        const person = await service.create(input);
        return person;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to create person',
        });
      }
    }),

  // Update person
  update: protectedProcedure
    .input(updatePersonSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const { id, ...data } = input;

      try {
        const person = await service.update(id, data);
        if (!person) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Person not found',
          });
        }
        return person;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to update person',
        });
      }
    }),

  // Get person by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const person = await service.getById(input.id);
      
      if (!person) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found',
        });
      }

      return person;
    }),

  // Get person by email
  getByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const person = await service.getByEmail(input.email);
      
      if (!person) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found',
        });
      }

      return person;
    }),

  // Search persons
  search: protectedProcedure
    .input(searchPersonSchema)
    .query(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const result = await service.search(input);
      return result;
    }),

  // Link to organization
  linkToOrganization: protectedProcedure
    .input(z.object({
      personId: z.number(),
      organizationId: z.number(),
      role: z.string().optional(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      await service.linkToOrganization(
        input.personId,
        input.organizationId,
        {
          role: input.role,
          isPrimary: input.isPrimary,
        }
      );

      return { success: true };
    }),

  // Unlink from organization
  unlinkFromOrganization: protectedProcedure
    .input(z.object({
      personId: z.number(),
      organizationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      await service.unlinkFromOrganization(
        input.personId,
        input.organizationId
      );

      return { success: true };
    }),

  // Merge persons
  merge: protectedProcedure
    .input(z.object({
      primaryId: z.number(),
      secondaryId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      try {
        const merged = await service.merge(input.primaryId, input.secondaryId);
        return merged;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to merge persons',
        });
      }
    }),

  // Update tags
  updateTags: protectedProcedure
    .input(z.object({
      personId: z.number(),
      tags: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const person = await service.updateTags(input.personId, input.tags);
      
      if (!person) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found',
        });
      }

      return person;
    }),

  // Convert lead to customer
  convertToCustomer: protectedProcedure
    .input(z.object({ personId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const person = await service.convertToCustomer(input.personId);
      
      if (!person) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found',
        });
      }

      return person;
    }),

  // Get activity timeline
  getActivityTimeline: protectedProcedure
    .input(z.object({ personId: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = new PersonService({
        db: ctx.db,
        organizationId: ctx.session.user.organizationId,
        userId: ctx.session.user.id,
      });

      const timeline = await service.getActivityTimeline(input.personId);
      return timeline;
    }),
});