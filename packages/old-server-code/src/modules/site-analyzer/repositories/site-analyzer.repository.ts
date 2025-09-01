/**
 * Site Analyzer Repository
 * Handles data access for site analysis operations using unified audit system
 */

import { db } from "@/db";
import { auditResults, auditQueue, auditTypeEnum, auditStatusEnum } from "@/db/schema/audit-results";
import { record, objectDefinition } from "@/db/schema/platform/core";
import { association } from "@/db/schema/platform/associations";
import {
  eq,
  and,
  desc,
  sql,
  max,
  inArray,
  gte,
  lte,
} from "drizzle-orm";
import { globalContext } from "@/core/context/global-context";

export class SiteAnalyzerRepository {
  
  // ==========================================
  // DOMAIN RECORD OPERATIONS
  // ==========================================
  
  /**
   * Find domain record by domain name
   */
  async findDomainRecord(domain: string, organizationId?: string) {
    const orgId = organizationId || globalContext.organizationId;
    const domainObjectDef = await db
      .select()
      .from(objectDefinition)
      .where(eq(objectDefinition.objectType, "domain"))
      .limit(1);
    
    if (!domainObjectDef[0]) {
      throw new Error("Domain object type not found");
    }
    
    const domainRecord = await db
      .select()
      .from(record)
      .where(
        and(
          eq(record.organizationId, orgId),
          eq(record.objectDefinitionId, domainObjectDef[0].id),
          sql`${record.properties}->>'domain' = ${domain}`
        )
      )
      .limit(1);
    
    return domainRecord[0] || null;
  }
  
  /**
   * Create or update domain record
   */
  async upsertDomainRecord(domainData: {
    domain: string;
    parentDomain?: string;
    name?: string;
    favicon?: string;
    status?: string;
    organizationId?: string;
  }) {
    const orgId = domainData.organizationId || globalContext.organizationId;
    const domainObjectDef = await db
      .select()
      .from(objectDefinition)
      .where(eq(objectDefinition.objectType, "domain"))
      .limit(1);
    
    if (!domainObjectDef[0]) {
      throw new Error("Domain object type not found");
    }
    
    const existingRecord = await this.findDomainRecord(domainData.domain, orgId);
    
    const properties = {
      domain: domainData.domain,
      parentDomain: domainData.parentDomain,
      name: domainData.name || domainData.domain,
      favicon: domainData.favicon,
      status: domainData.status || "active",
    };
    
    if (existingRecord) {
      // Update existing record
      const [updated] = await db
        .update(record)
        .set({
          properties,
          displayName: domainData.name || domainData.domain,
          updatedAt: new Date(),
        })
        .where(eq(record.id, existingRecord.id))
        .returning();
      
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(record)
        .values({
          objectDefinitionId: domainObjectDef[0].id,
          organizationId: orgId,
          properties,
          displayName: domainData.name || domainData.domain,
        })
        .returning();
      
      return created;
    }
  }
  
  // ==========================================
  // AUDIT OPERATIONS
  // ==========================================
  
  /**
   * Create new audit result
   */
  async createAuditResult(auditData: {
    domainRecordId: number;
    url: string;
    auditType: string;
    results: any;
    summary?: any;
    score?: number;
    status?: string;
    duration?: number;
    triggeredBy?: string;
    metadata?: any;
  }) {
    // Get the next version number for this domain + audit type
    const latestVersion = await db
      .select({ maxVersion: max(auditResults.version) })
      .from(auditResults)
      .where(
        and(
          eq(auditResults.domainRecordId, auditData.domainRecordId),
          eq(auditResults.auditType, auditData.auditType as any)
        )
      );
    
    const nextVersion = (latestVersion[0]?.maxVersion || 0) + 1;
    
    const [created] = await db
      .insert(auditResults)
      .values({
        domainRecordId: auditData.domainRecordId,
        url: auditData.url,
        auditType: auditData.auditType as any,
        version: nextVersion,
        results: auditData.results,
        summary: auditData.summary || {},
        score: auditData.score,
        status: (auditData.status as any) || "complete",
        duration: auditData.duration,
        triggeredBy: auditData.triggeredBy,
        metadata: auditData.metadata || {},
        completedAt: new Date(),
      })
      .returning();
    
    return created;
  }
  
  /**
   * Get latest audit result for a domain by type
   */
  async getLatestAuditResult(domainRecordId: number, auditType: string) {
    const result = await db
      .select()
      .from(auditResults)
      .where(
        and(
          eq(auditResults.domainRecordId, domainRecordId),
          eq(auditResults.auditType, auditType as any)
        )
      )
      .orderBy(desc(auditResults.version))
      .limit(1);
    
    return result[0] || null;
  }
  
  /**
   * Get audit history for a domain
   */
  async getAuditHistory(
    domainRecordId: number,
    auditType?: string,
    limit: number = 10,
    offset: number = 0
  ) {
    // Build the where conditions array
    const whereConditions = [eq(auditResults.domainRecordId, domainRecordId)];
    
    if (auditType) {
      whereConditions.push(eq(auditResults.auditType, auditType as any));
    }
    
    const results = await db
      .select()
      .from(auditResults)
      .where(and(...whereConditions))
      .orderBy(desc(auditResults.createdAt))
      .limit(limit)
      .offset(offset);
    
    return results;
  }
  
  /**
   * Get audit results for multiple domains
   */
  async getAuditResultsForDomains(
    domainRecordIds: number[],
    auditType?: string,
    latestOnly: boolean = true
  ) {
    const whereConditions = [inArray(auditResults.domainRecordId, domainRecordIds)];
    
    if (auditType) {
      whereConditions.push(eq(auditResults.auditType, auditType as any));
    }
    
    let query = db
      .select()
      .from(auditResults)
      .where(and(...whereConditions));
    
    if (latestOnly) {
      // Get latest version for each domain
      const latestVersionsSubquery = db
        .select({
          domainRecordId: auditResults.domainRecordId,
          auditType: auditResults.auditType,
          maxVersion: max(auditResults.version).as("maxVersion"),
        })
        .from(auditResults)
        .where(inArray(auditResults.domainRecordId, domainRecordIds))
        .groupBy(auditResults.domainRecordId, auditResults.auditType)
        .as("latest");
      
      const latestOnlyQuery = db
        .select({
          id: auditResults.id,
          domainRecordId: auditResults.domainRecordId,
          url: auditResults.url,
          auditType: auditResults.auditType,
          version: auditResults.version,
          results: auditResults.results,
          summary: auditResults.summary,
          score: auditResults.score,
          status: auditResults.status,
          createdAt: auditResults.createdAt,
          completedAt: auditResults.completedAt,
          duration: auditResults.duration,
        })
        .from(auditResults)
        .innerJoin(
          latestVersionsSubquery,
          and(
            eq(auditResults.domainRecordId, latestVersionsSubquery.domainRecordId),
            eq(auditResults.auditType, latestVersionsSubquery.auditType),
            eq(auditResults.version, latestVersionsSubquery.maxVersion)
          )
        );
        
      const results = await latestOnlyQuery.orderBy(desc(auditResults.createdAt));
      return results;
    }
    
    const results = await query.orderBy(desc(auditResults.createdAt));
    return results;
  }
  
  // ==========================================
  // QUEUE OPERATIONS
  // ==========================================
  
  /**
   * Add audit to queue
   */
  async queueAudit(queueData: {
    domainRecordId: number;
    url: string;
    auditType: string;
    priority?: number;
    scheduledFor?: Date;
    config?: any;
    metadata?: any;
  }) {
    const [queued] = await db
      .insert(auditQueue)
      .values({
        domainRecordId: queueData.domainRecordId,
        url: queueData.url,
        auditType: queueData.auditType as any,
        priority: queueData.priority || 0,
        scheduledFor: queueData.scheduledFor,
        config: queueData.config || {},
        metadata: queueData.metadata || {},
      })
      .returning();
    
    return queued;
  }
  
  /**
   * Get next audit from queue
   */
  async getNextAuditFromQueue() {
    const result = await db
      .select()
      .from(auditQueue)
      .where(eq(auditQueue.status, "queued"))
      .orderBy(desc(auditQueue.priority), auditQueue.createdAt)
      .limit(1);
    
    if (result[0]) {
      // Mark as processing
      await db
        .update(auditQueue)
        .set({
          status: "processing",
          lastAttemptAt: new Date(),
          attempts: sql`${auditQueue.attempts} + 1`,
        })
        .where(eq(auditQueue.id, result[0].id));
    }
    
    return result[0] || null;
  }
  
  /**
   * Complete audit queue item
   */
  async completeAuditQueueItem(queueId: number, status: "completed" | "failed") {
    await db
      .update(auditQueue)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(auditQueue.id, queueId));
  }
  
  // ==========================================
  // SEARCH AND FILTERING
  // ==========================================
  
  /**
   * Search domains with audit data
   */
  async searchDomainsWithAudits(organizationId?: string, filters?: {
    domain?: string;
    hasAuditType?: string;
    minScore?: number;
    maxScore?: number;
    since?: Date;
  }) {
    const orgId = organizationId || globalContext.organizationId;
    const domainObjectDef = await db
      .select()
      .from(objectDefinition)
      .where(eq(objectDefinition.objectType, "domain"))
      .limit(1);
    
    if (!domainObjectDef[0]) {
      return [];
    }
    
    const whereConditions = [
      eq(record.organizationId, orgId),
      eq(record.objectDefinitionId, domainObjectDef[0].id)
    ];
    
    if (filters?.domain) {
      whereConditions.push(
        sql`${record.properties}->>'domain' ILIKE ${`%${filters.domain}%`}`
      );
    }
    
    if (filters?.hasAuditType) {
      whereConditions.push(
        eq(auditResults.auditType, filters.hasAuditType as any)
      );
    }
    
    if (filters?.minScore) {
      whereConditions.push(
        gte(auditResults.score, filters.minScore)
      );
    }
    
    if (filters?.maxScore) {
      whereConditions.push(
        lte(auditResults.score, filters.maxScore)
      );
    }
    
    if (filters?.since) {
      whereConditions.push(
        gte(auditResults.createdAt, filters.since)
      );
    }
    
    const query = db
      .select({
        domainRecord: record,
        latestAudit: auditResults,
      })
      .from(record)
      .leftJoin(
        auditResults,
        eq(auditResults.domainRecordId, record.id)
      )
      .where(and(...whereConditions));
    
    const results = await query.orderBy(desc(auditResults.createdAt));
    return results;
  }
  
  // ==========================================
  // ASSOCIATION OPERATIONS
  // ==========================================
  
  /**
   * Associate domain with client/company/contact
   * Note: Simplified implementation - full association type management would require
   * looking up typeId from associationType table
   */
  async associateDomainWithRecord(
    domainRecordId: number, 
    targetRecordId: number,
    associationType: string = "domain_to_client",
    metadata?: any
  ) {
    // For now, use a default typeId of 1 - this should be looked up from associationType table
    // in a full implementation
    const [created] = await db
      .insert(association)
      .values({
        typeId: 1, // Default association type
        fromRecordId: domainRecordId,
        toRecordId: targetRecordId,
        organizationId: globalContext.organizationId,
        properties: metadata || {},
      })
      .returning();
    
    return created;
  }
  
  /**
   * Get associated records for a domain
   */
  async getDomainAssociations(domainRecordId: number, associationType?: string) {
    const whereConditions = [eq(association.fromRecordId, domainRecordId)];
    
    // Note: Full implementation would look up typeId from associationType table
    // For now, we ignore the associationType parameter
    
    const query = db
      .select({
        association,
        targetRecord: record,
        targetObjectDef: objectDefinition,
      })
      .from(association)
      .innerJoin(record, eq(association.toRecordId, record.id))
      .innerJoin(objectDefinition, eq(record.objectDefinitionId, objectDefinition.id))
      .where(and(...whereConditions));
    
    return await query;
  }
  
  /**
   * Get domains associated with a client/company/contact
   */
  async getDomainsForRecord(targetRecordId: number, associationType?: string) {
    const whereConditions = [eq(association.toRecordId, targetRecordId)];
    
    // Note: Full implementation would look up typeId from associationType table
    // For now, we ignore the associationType parameter
    
    const query = db
      .select({
        association,
        domainRecord: record,
      })
      .from(association)
      .innerJoin(record, eq(association.fromRecordId, record.id))
      .where(and(...whereConditions));
    
    return await query;
  }
  
  /**
   * Remove association between domain and record
   */
  async removeAssociation(domainRecordId: number, targetRecordId: number, associationType?: string) {
    const whereConditions = [
      eq(association.fromRecordId, domainRecordId),
      eq(association.toRecordId, targetRecordId)
    ];
    
    // Note: Full implementation would look up typeId from associationType table
    // For now, we ignore the associationType parameter
    
    return await db
      .delete(association)
      .where(and(...whereConditions));
  }
}