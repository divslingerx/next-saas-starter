/**
 * Person Service
 * Business logic for unified identity management
 */

import { z } from 'zod';
import { and, eq, or, ilike, sql, isNull } from 'drizzle-orm';
import type { db as Database } from '@charmlabs/db/client';
import { BaseRepository, type PaginatedResult } from '../repositories/base.repository';
import { person, personOrganization, type Person, type PersonOrganization } from '../identity/person';
import { organization, type Organization } from '../identity/organization';

export interface PersonServiceOptions {
  db: typeof Database;
  organizationId?: number;
  userId?: number;
}

export interface CreatePersonInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  department?: string;
  isCustomer?: boolean;
  isLead?: boolean;
  isContact?: boolean;
  isVendor?: boolean;
  isPartner?: boolean;
  isEmployee?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  organizationId?: number;
  organizationRole?: string;
}

export interface UpdatePersonInput extends Partial<CreatePersonInput> {
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface PersonWithOrganizations extends Person {
  organizations?: Array<{
    organization: Organization;
    role?: string;
    isPrimary: boolean;
  }>;
}

export interface SearchPersonInput {
  query?: string;
  roles?: Array<'customer' | 'lead' | 'contact' | 'vendor' | 'partner' | 'employee'>;
  organizationId?: number;
  tags?: string[];
  isActive?: boolean;
  page?: number;
  limit?: number;
}

const personSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Service for person/identity management
 */
export class PersonService {
  private personRepo: BaseRepository<Person>;
  private personOrgRepo: BaseRepository<PersonOrganization>;
  private orgRepo: BaseRepository<Organization>;
  private defaultOrgId?: number;
  private userId?: number;

  constructor(options: PersonServiceOptions) {
    this.personRepo = new BaseRepository(person, options.db);
    this.personOrgRepo = new BaseRepository(personOrganization, options.db);
    this.orgRepo = new BaseRepository(organization, options.db);
    this.defaultOrgId = options.organizationId;
    this.userId = options.userId;
  }

  /**
   * Create a new person
   */
  async create(input: CreatePersonInput): Promise<PersonWithOrganizations> {
    // Validate input
    const validation = personSchema.safeParse(input);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    // Check for existing person with same email
    const existing = await this.personRepo.findOne(
      eq(person.email, input.email)
    );

    if (existing) {
      throw new Error(`Person with email ${input.email} already exists`);
    }

    // Create person
    const newPerson = await this.personRepo.create({
      uid: crypto.randomUUID(),
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      fullName: [input.firstName, input.lastName].filter(Boolean).join(' ') || input.email,
      phone: input.phone,
      title: input.title,
      department: input.department,
      isCustomer: input.isCustomer || false,
      isLead: input.isLead || false,
      isContact: input.isContact || false,
      isVendor: input.isVendor || false,
      isPartner: input.isPartner || false,
      isEmployee: input.isEmployee || false,
      metadata: input.metadata || {},
      tags: input.tags || [],
      isActive: true,
      emailVerified: false,
      createdBy: this.userId,
      updatedBy: this.userId,
    } as any);

    // Link to organization if provided
    if (input.organizationId) {
      await this.linkToOrganization(newPerson.id, input.organizationId, {
        role: input.organizationRole,
        isPrimary: true,
      });
    }

    return await this.getById(newPerson.id) as PersonWithOrganizations;
  }

  /**
   * Update a person
   */
  async update(id: number, input: UpdatePersonInput): Promise<PersonWithOrganizations | null> {
    const existing = await this.personRepo.findById(id);
    if (!existing) {
      throw new Error(`Person ${id} not found`);
    }

    // Update full name if name parts changed
    let fullName = existing.fullName;
    if (input.firstName !== undefined || input.lastName !== undefined) {
      const firstName = input.firstName ?? existing.firstName;
      const lastName = input.lastName ?? existing.lastName;
      fullName = [firstName, lastName].filter(Boolean).join(' ') || existing.email;
    }

    const updated = await this.personRepo.update(id, {
      ...input,
      fullName,
      updatedBy: this.userId,
      updatedAt: new Date(),
    } as any);

    return updated ? await this.getById(id) : null;
  }

  /**
   * Get person by ID with organizations
   */
  async getById(id: number): Promise<PersonWithOrganizations | null> {
    const personData = await this.personRepo.findById(id);
    if (!personData) return null;

    // Get organizations
    const personOrgs = await this.personOrgRepo.findMany({
      where: eq(personOrganization.personId, id)
    });

    const organizations = await Promise.all(
      personOrgs.map(async (po) => {
        const org = await this.orgRepo.findById(po.organizationId);
        return {
          organization: org!,
          role: po.role,
          isPrimary: po.isPrimary,
        };
      })
    );

    return {
      ...personData,
      organizations: organizations.filter(o => o.organization),
    };
  }

  /**
   * Get person by email
   */
  async getByEmail(email: string): Promise<PersonWithOrganizations | null> {
    const personData = await this.personRepo.findOne(
      eq(person.email, email)
    );

    if (!personData) return null;
    return await this.getById(personData.id);
  }

  /**
   * Search persons
   */
  async search(input: SearchPersonInput): Promise<PaginatedResult<PersonWithOrganizations>> {
    const conditions: any[] = [];

    // Text search
    if (input.query) {
      conditions.push(
        or(
          ilike(person.email, `%${input.query}%`),
          ilike(person.firstName, `%${input.query}%`),
          ilike(person.lastName, `%${input.query}%`),
          ilike(person.fullName, `%${input.query}%`),
          ilike(person.phone, `%${input.query}%`)
        )
      );
    }

    // Role filters
    if (input.roles && input.roles.length > 0) {
      const roleConditions = input.roles.map(role => {
        switch (role) {
          case 'customer': return eq(person.isCustomer, true);
          case 'lead': return eq(person.isLead, true);
          case 'contact': return eq(person.isContact, true);
          case 'vendor': return eq(person.isVendor, true);
          case 'partner': return eq(person.isPartner, true);
          case 'employee': return eq(person.isEmployee, true);
          default: return undefined;
        }
      }).filter(Boolean);

      if (roleConditions.length > 0) {
        conditions.push(or(...roleConditions));
      }
    }

    // Organization filter
    if (input.organizationId) {
      const personIds = await this.personOrgRepo.findMany({
        where: eq(personOrganization.organizationId, input.organizationId)
      }).then(pos => pos.map(po => po.personId));

      if (personIds.length > 0) {
        conditions.push(sql`${person.id} = ANY(${personIds})`);
      } else {
        // No persons in this organization
        conditions.push(sql`false`);
      }
    }

    // Tag filter
    if (input.tags && input.tags.length > 0) {
      conditions.push(
        sql`${person.tags} && ${input.tags}`
      );
    }

    // Active filter
    if (input.isActive !== undefined) {
      conditions.push(eq(person.isActive, input.isActive));
    }

    // Always exclude deleted
    conditions.push(isNull(person.deletedAt));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.personRepo.findPaginated(
      {
        page: input.page,
        limit: input.limit,
        orderBy: 'updatedAt',
        orderDirection: 'desc',
      },
      where
    );

    // Enrich with organizations
    const enrichedData = await Promise.all(
      result.data.map(p => this.getById(p.id).then(person => person!))
    );

    return {
      ...result,
      data: enrichedData,
    };
  }

  /**
   * Link person to organization
   */
  async linkToOrganization(
    personId: number,
    organizationId: number,
    options?: {
      role?: string;
      isPrimary?: boolean;
    }
  ): Promise<void> {
    // Check if link already exists
    const existing = await this.personOrgRepo.findOne(
      and(
        eq(personOrganization.personId, personId),
        eq(personOrganization.organizationId, organizationId)
      )
    );

    if (existing) {
      // Update existing link
      await this.personOrgRepo.update(existing.id, {
        role: options?.role || existing.role,
        isPrimary: options?.isPrimary ?? existing.isPrimary,
      } as any);
    } else {
      // Create new link
      await this.personOrgRepo.create({
        personId,
        organizationId,
        role: options?.role,
        isPrimary: options?.isPrimary || false,
        startDate: new Date(),
      } as any);
    }
  }

  /**
   * Remove person from organization
   */
  async unlinkFromOrganization(
    personId: number,
    organizationId: number
  ): Promise<void> {
    const link = await this.personOrgRepo.findOne(
      and(
        eq(personOrganization.personId, personId),
        eq(personOrganization.organizationId, organizationId)
      )
    );

    if (link) {
      await this.personOrgRepo.update(link.id, {
        endDate: new Date(),
        isActive: false,
      } as any);
    }
  }

  /**
   * Merge two persons
   */
  async merge(primaryId: number, secondaryId: number): Promise<Person> {
    const primary = await this.personRepo.findById(primaryId);
    const secondary = await this.personRepo.findById(secondaryId);

    if (!primary || !secondary) {
      throw new Error('One or both persons not found');
    }

    // Merge data (primary takes precedence)
    const merged = {
      firstName: primary.firstName || secondary.firstName,
      lastName: primary.lastName || secondary.lastName,
      phone: primary.phone || secondary.phone,
      title: primary.title || secondary.title,
      department: primary.department || secondary.department,
      metadata: { ...secondary.metadata, ...primary.metadata },
      tags: [...new Set([...(primary.tags || []), ...(secondary.tags || [])])],
      // Combine roles
      isCustomer: primary.isCustomer || secondary.isCustomer,
      isLead: primary.isLead || secondary.isLead,
      isContact: primary.isContact || secondary.isContact,
      isVendor: primary.isVendor || secondary.isVendor,
      isPartner: primary.isPartner || secondary.isPartner,
      isEmployee: primary.isEmployee || secondary.isEmployee,
    };

    // Update primary with merged data
    await this.personRepo.update(primaryId, merged as any);

    // Move all organization links from secondary to primary
    const secondaryOrgs = await this.personOrgRepo.findMany({
      where: eq(personOrganization.personId, secondaryId)
    });

    for (const org of secondaryOrgs) {
      await this.linkToOrganization(primaryId, org.organizationId, {
        role: org.role,
        isPrimary: org.isPrimary,
      });
    }

    // Soft delete secondary
    await this.personRepo.update(secondaryId, {
      deletedAt: new Date(),
      deletedBy: this.userId,
      metadata: {
        ...secondary.metadata,
        mergedInto: primaryId,
        mergedAt: new Date().toISOString(),
      }
    } as any);

    return (await this.personRepo.findById(primaryId))!;
  }

  /**
   * Get person's activity timeline
   */
  async getActivityTimeline(personId: number): Promise<any[]> {
    // This would connect to various activity sources
    // For now, return placeholder
    return [];
  }

  /**
   * Update person tags
   */
  async updateTags(personId: number, tags: string[]): Promise<Person | null> {
    return await this.personRepo.update(personId, {
      tags,
      updatedBy: this.userId,
      updatedAt: new Date(),
    } as any);
  }

  /**
   * Convert lead to customer
   */
  async convertToCustomer(personId: number): Promise<Person | null> {
    return await this.personRepo.update(personId, {
      isLead: false,
      isCustomer: true,
      metadata: sql`jsonb_set(metadata, '{convertedAt}', to_jsonb(now()))`,
      updatedBy: this.userId,
      updatedAt: new Date(),
    } as any);
  }
}