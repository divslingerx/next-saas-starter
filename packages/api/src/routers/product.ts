import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { ProductService } from "@charmlabs/ecom/services";
import { insertProductSchema } from "@charmlabs/ecom/schemas/product";
import { TRPCError } from "@trpc/server";

// Input validation schemas
const listProductsSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  handle: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "price"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const getProductSchema = z.object({
  id: z.number().optional(),
  handle: z.string().optional(),
}).refine((data) => data.id || data.handle, {
  message: "Either id or handle must be provided",
});

const createProductSchema = z.object({
  title: z.string().min(1).max(255),
  bodyHtml: z.string().optional(),
  handle: z.string().regex(/^[a-z0-9-]+$/).optional(),
  productType: z.string().optional(),
  vendor: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  templateSuffix: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  socialImage: z.string().url().optional(),
  publishedScope: z.string().default("web"),
  variants: z.array(z.object({
    title: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    position: z.number().optional(),
    option1: z.string().optional(),
    option2: z.string().optional(),
    option3: z.string().optional(),
    price: z.number().min(0),
    compareAtPrice: z.number().min(0).optional(),
    inventoryQuantity: z.number().min(0).optional(),
    inventoryManagement: z.string().optional(),
    inventoryPolicy: z.string().optional(),
    fulfillmentService: z.string().optional(),
    grams: z.number().optional(),
    weight: z.number().optional(),
    weightUnit: z.string().optional(),
    requiresShipping: z.boolean().optional(),
    taxable: z.boolean().optional(),
    imageId: z.number().optional(),
  })).optional(),
  images: z.array(z.object({
    src: z.string().url(),
    position: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).optional(),
  options: z.array(z.object({
    name: z.string(),
    position: z.number().optional(),
    values: z.array(z.string()).optional(),
  })).optional(),
});

const updateProductSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(255).optional(),
  bodyHtml: z.string().optional(),
  handle: z.string().regex(/^[a-z0-9-]+$/).optional(),
  productType: z.string().optional(),
  vendor: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  templateSuffix: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  socialImage: z.string().url().optional(),
  publishedScope: z.string().optional(),
});

const deleteProductSchema = z.object({
  id: z.number(),
});

const searchProductSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(100).default(20),
});

const addVariantSchema = z.object({
  productId: z.number(),
  variant: z.object({
    title: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    position: z.number().optional(),
    option1: z.string().optional(),
    option2: z.string().optional(),
    option3: z.string().optional(),
    price: z.number().min(0),
    compareAtPrice: z.number().min(0).optional(),
    inventoryQuantity: z.number().min(0).optional(),
    inventoryManagement: z.string().optional(),
    inventoryPolicy: z.string().optional(),
    fulfillmentService: z.string().optional(),
    grams: z.number().optional(),
    weight: z.number().optional(),
    weightUnit: z.string().optional(),
    requiresShipping: z.boolean().optional(),
    taxable: z.boolean().optional(),
    imageId: z.number().optional(),
  }),
});

const updateInventorySchema = z.object({
  variantId: z.number(),
  quantity: z.number().min(0),
  locationId: z.number().optional(),
});

const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.number(),
    data: updateProductSchema.omit({ id: true }),
  })).min(1).max(100),
});

export const productRouter = createTRPCRouter({
  // Public procedures - anyone can view products
  list: publicProcedure
    .input(listProductsSchema)
    .query(async ({ ctx, input }) => {
      const productService = new ProductService(ctx.db);
      return productService.list(input);
    }),

  get: publicProcedure
    .input(getProductSchema)
    .query(async ({ ctx, input }) => {
      const productService = new ProductService(ctx.db);
      
      let product;
      if (input.id) {
        product = await productService.findById(input.id);
      } else if (input.handle) {
        product = await productService.findByHandle(input.handle);
      }

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return product;
    }),

  search: publicProcedure
    .input(searchProductSchema)
    .query(async ({ ctx, input }) => {
      const productService = new ProductService(ctx.db);
      return productService.search(input.query, input.limit);
    }),

  // Protected procedures - require authentication
  create: protectedProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      const productService = new ProductService(ctx.db);
      
      try {
        return await productService.create(input);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("already exists")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: error.message,
            });
          }
        }
        throw error;
      }
    }),

  update: protectedProcedure
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const productService = new ProductService(ctx.db);
      
      try {
        return await productService.update(input.id, input);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Product not found") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }
        }
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(deleteProductSchema)
    .mutation(async ({ ctx, input }) => {
      const productService = new ProductService(ctx.db);
      await productService.delete(input.id);
      return { success: true };
    }),

  addVariant: protectedProcedure
    .input(addVariantSchema)
    .mutation(async ({ ctx, input }) => {
      const productService = new ProductService(ctx.db);
      
      try {
        return await productService.addVariant(input.productId, input.variant);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Product not found") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }
        }
        throw error;
      }
    }),

  updateInventory: protectedProcedure
    .input(updateInventorySchema)
    .mutation(async ({ ctx, input }) => {
      const productService = new ProductService(ctx.db);
      
      try {
        await productService.updateInventory(
          input.variantId, 
          input.quantity, 
          input.locationId
        );
        return { success: true };
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Variant not found") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }
        }
        throw error;
      }
    }),

  bulkUpdate: protectedProcedure
    .input(bulkUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const productService = new ProductService(ctx.db);
      await productService.bulkUpdate(input.updates);
      return { success: true, count: input.updates.length };
    }),
});