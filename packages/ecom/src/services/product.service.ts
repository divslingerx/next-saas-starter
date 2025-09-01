import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { 
  product, 
  productVariant, 
  productImage, 
  productOptions, 
  productOptionValues,
  type Product,
  type ProductVariant,
  type ProductImage as ProductImageType,
} from "../core/schemas/product";
import * as schema from "../schema";

export interface CreateProductDTO {
  title: string;
  bodyHtml?: string;
  handle?: string;
  productType?: string;
  vendor?: string;
  status?: string;
  templateSuffix?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  socialImage?: string;
  publishedScope?: string;
  variants?: CreateVariantDTO[];
  images?: CreateImageDTO[];
  options?: CreateOptionDTO[];
}

export interface CreateVariantDTO {
  title?: string;
  sku?: string;
  barcode?: string;
  position?: number;
  option1?: string;
  option2?: string;
  option3?: string;
  price: number;
  compareAtPrice?: number;
  inventoryQuantity?: number;
  inventoryManagement?: string;
  inventoryPolicy?: string;
  fulfillmentService?: string;
  grams?: number;
  weight?: number;
  weightUnit?: string;
  requiresShipping?: boolean;
  taxable?: boolean;
  imageId?: number;
}

export interface CreateImageDTO {
  src: string;
  position?: number;
  width?: number;
  height?: number;
}

export interface CreateOptionDTO {
  name: string;
  position?: number;
  values?: string[];
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  id: number;
}

export interface ProductFilters {
  search?: string;
  status?: string;
  vendor?: string;
  productType?: string;
  handle?: string;
  limit?: number;
  offset?: number;
  sortBy?: "title" | "createdAt" | "updatedAt" | "price";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedProducts {
  products: (Product & {
    variants?: ProductVariant[];
    images?: ProductImageType[];
  })[];
  total: number;
  limit: number;
  offset: number;
}

export class ProductService {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * Generate a URL-friendly handle from a title
   */
  private generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Create a new product with variants and images
   */
  async create(data: CreateProductDTO): Promise<Product & { variants?: ProductVariant[]; images?: ProductImageType[] }> {
    return this.db.transaction(async (tx) => {
      // Generate handle if not provided
      const handle = data.handle || this.generateHandle(data.title);

      // Check if handle already exists
      const existing = await tx
        .select()
        .from(product)
        .where(eq(product.handle, handle))
        .limit(1);

      if (existing.length > 0) {
        throw new Error(`Product with handle "${handle}" already exists`);
      }

      // Create the product
      const [newProduct] = await tx
        .insert(product)
        .values({
          title: data.title,
          bodyHtml: data.bodyHtml,
          handle,
          productType: data.productType,
          vendor: data.vendor,
          status: data.status || "draft",
          templateSuffix: data.templateSuffix,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          seoKeywords: data.seoKeywords,
          canonicalUrl: data.canonicalUrl,
          socialImage: data.socialImage,
          publishedScope: data.publishedScope || "web",
          publishedAt: data.status === "active" ? new Date() : null,
        })
        .returning();

      if (!newProduct) {
        throw new Error("Failed to create product");
      }

      // Create product options if provided
      if (data.options && data.options.length > 0) {
        for (const option of data.options) {
          const [newOption] = await tx
            .insert(productOptions)
            .values({
              productId: newProduct.id,
              name: option.name,
              position: option.position,
            })
            .returning();

          // Create option values
          if (option.values && option.values.length > 0 && newOption) {
            for (let i = 0; i < option.values.length; i++) {
              await tx.insert(productOptionValues).values({
                productId: newProduct.id,
                productOptionId: newOption.id,
                index: i,
                value: option.values[i],
              });
            }
          }
        }
      }

      // Create variants
      const createdVariants: ProductVariant[] = [];
      if (data.variants && data.variants.length > 0) {
        for (const variantData of data.variants) {
          const variant = await this.createVariant(tx, newProduct.id, variantData);
          createdVariants.push(variant);
        }
      } else {
        // Create default variant if none provided
        const defaultVariant = await this.createVariant(tx, newProduct.id, {
          title: "Default Title",
          price: 0,
          inventoryQuantity: 0,
        });
        createdVariants.push(defaultVariant);
      }

      // Create images
      const createdImages: ProductImageType[] = [];
      if (data.images && data.images.length > 0) {
        for (const imageData of data.images) {
          const [newImage] = await tx
            .insert(productImage)
            .values({
              productId: newProduct.id,
              src: imageData.src,
              position: imageData.position,
              width: imageData.width,
              height: imageData.height,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          
          if (newImage) {
            createdImages.push(newImage);
          }
        }
      }

      return {
        ...newProduct,
        variants: createdVariants,
        images: createdImages,
      };
    });
  }

  /**
   * Create a variant for a product
   */
  private async createVariant(
    tx: PostgresJsDatabase<typeof schema>,
    productId: number,
    variantData: CreateVariantDTO
  ): Promise<ProductVariant> {
    // Create inventory item if tracking inventory
    let inventoryItemId: number | null = null;
    if (variantData.inventoryManagement || variantData.inventoryQuantity !== undefined) {
      const [newInventoryItem] = await tx
        .insert(inventoryItem)
        .values({
          sku: variantData.sku,
          requiresShipping: variantData.requiresShipping,
          tracked: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      if (newInventoryItem) {
        inventoryItemId = newInventoryItem.id;

        // Create inventory level (assuming location 1 for now)
        await tx.insert(inventoryLevel).values({
          inventoryItemId: newInventoryItem.id,
          locationId: 1, // Default location
          available: variantData.inventoryQuantity || 0,
          updatedAt: new Date(),
        });
      }
    }

    // Create the variant
    const [newVariant] = await tx
      .insert(productVariant)
      .values({
        productId,
        inventoryItemId,
        title: variantData.title,
        sku: variantData.sku,
        barcode: variantData.barcode,
        position: variantData.position,
        option1: variantData.option1,
        option2: variantData.option2,
        option3: variantData.option3,
        price: variantData.price,
        compareAtPrice: variantData.compareAtPrice,
        inventoryQuantity: variantData.inventoryQuantity,
        inventoryManagement: variantData.inventoryManagement,
        inventoryPolicy: variantData.inventoryPolicy || "deny",
        fulfillmentService: variantData.fulfillmentService || "manual",
        grams: variantData.grams,
        weight: variantData.weight,
        weightUnit: variantData.weightUnit || "kg",
        requiresShipping: variantData.requiresShipping !== false,
        taxable: variantData.taxable !== false,
        imageId: variantData.imageId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newVariant) {
      throw new Error("Failed to create variant");
    }

    return newVariant;
  }

  /**
   * Update a product
   */
  async update(id: number, data: UpdateProductDTO): Promise<Product> {
    return this.db.transaction(async (tx) => {
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.variants;
      delete updateData.images;
      delete updateData.options;

      // Update handle if title changed and no custom handle provided
      if (data.title && !data.handle) {
        updateData.handle = this.generateHandle(data.title);
      }

      // Update published date if status changed to active
      if (data.status === "active") {
        const [existingProduct] = await tx
          .select()
          .from(product)
          .where(eq(product.id, id))
          .limit(1);

        if (existingProduct && !existingProduct.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }

      const [updatedProduct] = await tx
        .update(product)
        .set(updateData)
        .where(eq(product.id, id))
        .returning();

      if (!updatedProduct) {
        throw new Error("Product not found");
      }

      return updatedProduct;
    });
  }

  /**
   * Soft delete a product
   */
  async delete(id: number): Promise<void> {
    await this.db
      .update(product)
      .set({ 
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(product.id, id));
  }

  /**
   * Find product by ID with variants and images
   */
  async findById(id: number): Promise<(Product & { variants?: ProductVariant[]; images?: ProductImageType[] }) | null> {
    const [foundProduct] = await this.db
      .select()
      .from(product)
      .where(eq(product.id, id))
      .limit(1);

    if (!foundProduct) {
      return null;
    }

    // Get variants
    const variants = await this.db
      .select()
      .from(productVariant)
      .where(eq(productVariant.productId, id))
      .orderBy(asc(productVariant.position));

    // Get images
    const images = await this.db
      .select()
      .from(productImage)
      .where(eq(productImage.productId, id))
      .orderBy(asc(productImage.position));

    return {
      ...foundProduct,
      variants,
      images,
    };
  }

  /**
   * Find product by handle
   */
  async findByHandle(handle: string): Promise<(Product & { variants?: ProductVariant[]; images?: ProductImageType[] }) | null> {
    const [foundProduct] = await this.db
      .select()
      .from(product)
      .where(eq(product.handle, handle))
      .limit(1);

    if (!foundProduct) {
      return null;
    }

    return this.findById(foundProduct.id);
  }

  /**
   * List products with pagination and filters
   */
  async list(filters: ProductFilters = {}): Promise<PaginatedProducts> {
    const {
      search,
      status,
      vendor,
      productType,
      handle,
      limit = 20,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(product.title, `%${search}%`),
          like(product.bodyHtml, `%${search}%`),
          like(product.handle, `%${search}%`)
        )
      );
    }
    if (status) {
      conditions.push(eq(product.status, status));
    }
    if (vendor) {
      conditions.push(eq(product.vendor, vendor));
    }
    if (productType) {
      conditions.push(eq(product.productType, productType));
    }
    if (handle) {
      conditions.push(eq(product.handle, handle));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(product)
      .where(whereClause);

    // Build order by
    const orderByColumn = sortBy === "title" ? product.title :
                         sortBy === "price" ? product.createdAt : // Note: price is on variants
                         sortBy === "updatedAt" ? product.updatedAt :
                         product.createdAt;
    
    const orderByDirection = sortOrder === "asc" ? asc : desc;

    // Get products
    const products = await this.db
      .select()
      .from(product)
      .where(whereClause)
      .orderBy(orderByDirection(orderByColumn))
      .limit(limit)
      .offset(offset);

    // Get variants and images for each product
    const productsWithRelations = await Promise.all(
      products.map(async (p) => {
        const variants = await this.db
          .select()
          .from(productVariant)
          .where(eq(productVariant.productId, p.id))
          .orderBy(asc(productVariant.position));

        const images = await this.db
          .select()
          .from(productImage)
          .where(eq(productImage.productId, p.id))
          .orderBy(asc(productImage.position));

        return {
          ...p,
          variants,
          images,
        };
      })
    );

    return {
      products: productsWithRelations,
      total: Number(count),
      limit,
      offset,
    };
  }

  /**
   * Search products using full-text search
   */
  async search(query: string, limit = 20): Promise<Product[]> {
    return this.db
      .select()
      .from(product)
      .where(
        or(
          like(product.title, `%${query}%`),
          like(product.bodyHtml, `%${query}%`),
          like(product.vendor, `%${query}%`),
          like(product.productType, `%${query}%`)
        )
      )
      .limit(limit);
  }

  /**
   * Add a variant to an existing product
   */
  async addVariant(productId: number, variantData: CreateVariantDTO): Promise<ProductVariant> {
    return this.db.transaction(async (tx) => {
      // Verify product exists
      const [existingProduct] = await tx
        .select()
        .from(product)
        .where(eq(product.id, productId))
        .limit(1);

      if (!existingProduct) {
        throw new Error("Product not found");
      }

      return this.createVariant(tx, productId, variantData);
    });
  }

  /**
   * Update inventory for a variant
   */
  async updateInventory(variantId: number, quantity: number, locationId = 1): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Get variant
      const [variant] = await tx
        .select()
        .from(productVariant)
        .where(eq(productVariant.id, variantId))
        .limit(1);

      if (!variant) {
        throw new Error("Variant not found");
      }

      // Update variant inventory quantity
      await tx
        .update(productVariant)
        .set({
          inventoryQuantity: quantity,
          updatedAt: new Date(),
        })
        .where(eq(productVariant.id, variantId));

      // Update inventory level if tracking inventory
      if (variant.inventoryItemId) {
        await tx
          .update(inventoryLevel)
          .set({
            available: quantity,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventoryLevel.inventoryItemId, variant.inventoryItemId),
              eq(inventoryLevel.locationId, locationId)
            )
          );
      }
    });
  }

  /**
   * Bulk update products
   */
  async bulkUpdate(updates: { id: number; data: Partial<CreateProductDTO> }[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const { id, data } of updates) {
        await this.update(id, { ...data, id });
      }
    });
  }
}