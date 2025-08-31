import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import type { db as Database } from '@charmlabs/db/client';
import { 
  propertyHistory, 
  propertyHistorySummary,
  workflowPropertyTrigger,
  type PropertyHistory,
  type NewPropertyHistory,
  type PropertyHistorySummary,
  type WorkflowPropertyTrigger
} from '../history/property-history';
import { objectRecord } from '../objects/platform-objects';

export interface PropertyChange {
  propertyName: string;
  oldValue: any;
  newValue: any;
  changedBy?: {
    id: number;
    name: string;
    type: 'user' | 'system' | 'workflow' | 'integration';
  };
  changeSource?: 'ui' | 'api' | 'workflow' | 'import' | 'sync';
  changeReason?: string;
  workflowContext?: {
    workflowId: string;
    workflowName: string;
    executionId: string;
    stepId?: string;
  };
  batchContext?: {
    batchId: string;
    operation: string;
  };
}

export interface PropertyHistoryQuery {
  recordId?: number;
  propertyName?: string;
  changedById?: number;
  changeSource?: string;
  workflowId?: string;
  batchId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class PropertyHistoryService {
  constructor(private db: typeof Database) {}

  /**
   * Track property changes for a record
   */
  async trackChanges(
    recordId: number,
    organizationId: number,
    changes: PropertyChange[],
    context?: Record<string, any>
  ): Promise<PropertyHistory[]> {
    const historyEntries: NewPropertyHistory[] = [];
    const summaryUpdates: Map<string, PropertyHistorySummary> = new Map();

    for (const change of changes) {
      // Get previous history for this property
      const previousHistory = await this.getLatestChange(recordId, change.propertyName);
      
      // Calculate time elapsed if there was a previous change
      let timeElapsed: number | null = null;
      if (previousHistory) {
        timeElapsed = Math.floor(
          (Date.now() - new Date(previousHistory.changedAt).getTime()) / 1000
        );
      }

      // Determine property type from values
      const propertyType = this.inferPropertyType(change.newValue || change.oldValue);

      // Create history entry
      const entry: NewPropertyHistory = {
        organizationId,
        recordId,
        propertyName: change.propertyName,
        propertyType,
        oldValue: change.oldValue,
        newValue: change.newValue,
        oldTextValue: this.toTextValue(change.oldValue),
        newTextValue: this.toTextValue(change.newValue),
        oldNumericValue: this.toNumericValue(change.oldValue),
        newNumericValue: this.toNumericValue(change.newValue),
        oldDateValue: this.toDateValue(change.oldValue),
        newDateValue: this.toDateValue(change.newValue),
        changeType: change.oldValue == null ? 'created' : 
                   change.newValue == null ? 'deleted' : 'updated',
        changeSource: change.changeSource || 'api',
        changeReason: change.changeReason,
        changedById: change.changedBy?.id,
        changedByName: change.changedBy?.name,
        changedByType: change.changedBy?.type || 'system',
        workflowId: change.workflowContext?.workflowId,
        workflowName: change.workflowContext?.workflowName,
        workflowExecutionId: change.workflowContext?.executionId,
        workflowStepId: change.workflowContext?.stepId,
        batchId: change.batchContext?.batchId,
        batchOperation: change.batchContext?.operation,
        context,
        previousChangeId: previousHistory?.id,
        timeElapsedSeconds: timeElapsed,
      };

      historyEntries.push(entry);

      // Update summary
      await this.updateSummary(recordId, organizationId, change);
    }

    // Insert all history entries
    const inserted = await this.db
      .insert(propertyHistory)
      .values(historyEntries)
      .returning();

    // Check for workflow triggers
    await this.checkWorkflowTriggers(recordId, organizationId, changes);

    return inserted;
  }

  /**
   * Get property history for a record
   */
  async getHistory(query: PropertyHistoryQuery): Promise<PropertyHistory[]> {
    const conditions = [];

    if (query.recordId) {
      conditions.push(eq(propertyHistory.recordId, query.recordId));
    }
    if (query.propertyName) {
      conditions.push(eq(propertyHistory.propertyName, query.propertyName));
    }
    if (query.changedById) {
      conditions.push(eq(propertyHistory.changedById, query.changedById));
    }
    if (query.changeSource) {
      conditions.push(eq(propertyHistory.changeSource, query.changeSource));
    }
    if (query.workflowId) {
      conditions.push(eq(propertyHistory.workflowId, query.workflowId));
    }
    if (query.batchId) {
      conditions.push(eq(propertyHistory.batchId, query.batchId));
    }
    if (query.startDate) {
      conditions.push(gte(propertyHistory.changedAt, query.startDate));
    }
    if (query.endDate) {
      conditions.push(lte(propertyHistory.changedAt, query.endDate));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return await this.db
      .select()
      .from(propertyHistory)
      .where(where)
      .orderBy(desc(propertyHistory.changedAt))
      .limit(query.limit || 100)
      .offset(query.offset || 0);
  }

  /**
   * Get the latest change for a specific property
   */
  async getLatestChange(
    recordId: number,
    propertyName: string
  ): Promise<PropertyHistory | null> {
    const result = await this.db
      .select()
      .from(propertyHistory)
      .where(
        and(
          eq(propertyHistory.recordId, recordId),
          eq(propertyHistory.propertyName, propertyName)
        )
      )
      .orderBy(desc(propertyHistory.changedAt))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get property value at a specific point in time
   */
  async getValueAtTime(
    recordId: number,
    propertyName: string,
    timestamp: Date
  ): Promise<any> {
    const history = await this.db
      .select()
      .from(propertyHistory)
      .where(
        and(
          eq(propertyHistory.recordId, recordId),
          eq(propertyHistory.propertyName, propertyName),
          lte(propertyHistory.changedAt, timestamp)
        )
      )
      .orderBy(desc(propertyHistory.changedAt))
      .limit(1);

    if (history.length === 0) {
      return null;
    }

    return history[0].newValue;
  }

  /**
   * Restore a property to a previous value
   */
  async restoreValue(
    recordId: number,
    propertyName: string,
    historyId: number,
    restoredBy: { id: number; name: string }
  ): Promise<PropertyHistory> {
    // Get the history entry to restore
    const historyToRestore = await this.db
      .select()
      .from(propertyHistory)
      .where(eq(propertyHistory.id, historyId))
      .limit(1);

    if (historyToRestore.length === 0) {
      throw new Error('History entry not found');
    }

    const entry = historyToRestore[0];

    // Get current value
    const currentRecord = await this.db
      .select()
      .from(objectRecord)
      .where(eq(record.id, recordId))
      .limit(1);

    if (currentRecord.length === 0) {
      throw new Error('Record not found');
    }

    const currentProperties = currentRecord[0].properties as Record<string, any>;
    const currentValue = currentProperties[propertyName];

    // Track the restoration as a new change
    const restorationChange: PropertyChange = {
      propertyName,
      oldValue: currentValue,
      newValue: entry.newValue,
      changedBy: {
        id: restoredBy.id,
        name: restoredBy.name,
        type: 'user'
      },
      changeSource: 'ui',
      changeReason: `Restored to value from ${entry.changedAt}`
    };

    // Update the record
    const updatedProperties = {
      ...currentProperties,
      [propertyName]: entry.newValue
    };

    await this.db
      .update(objectRecord)
      .set({ properties: updatedProperties })
      .where(eq(objectRecord.id, recordId));

    // Track the change
    const [newHistory] = await this.trackChanges(
      recordId,
      entry.organizationId,
      [restorationChange],
      { restoredFromHistoryId: historyId }
    );

    return newHistory;
  }

  /**
   * Get property change summary
   */
  async getSummary(
    recordId: number,
    propertyName?: string
  ): Promise<PropertyHistorySummary[]> {
    const conditions = [eq(propertyHistorySummary.recordId, recordId)];
    
    if (propertyName) {
      conditions.push(eq(propertyHistorySummary.propertyName, propertyName));
    }

    return await this.db
      .select()
      .from(propertyHistorySummary)
      .where(and(...conditions));
  }

  /**
   * Update property history summary
   */
  private async updateSummary(
    recordId: number,
    organizationId: number,
    change: PropertyChange
  ): Promise<void> {
    // Get existing summary
    const existing = await this.db
      .select()
      .from(propertyHistorySummary)
      .where(
        and(
          eq(propertyHistorySummary.recordId, recordId),
          eq(propertyHistorySummary.propertyName, change.propertyName)
        )
      )
      .limit(1);

    const now = new Date();

    if (existing.length === 0) {
      // Create new summary
      await this.db.insert(propertyHistorySummary).values({
        organizationId,
        recordId,
        propertyName: change.propertyName,
        currentValue: change.newValue,
        currentTextValue: this.toTextValue(change.newValue),
        totalChanges: 1,
        firstValue: change.oldValue || change.newValue,
        firstChangedAt: now,
        firstChangedById: change.changedBy?.id,
        lastValue: change.newValue,
        lastChangedAt: now,
        lastChangedById: change.changedBy?.id,
        mostFrequentValue: change.newValue,
        mostFrequentValueCount: 1,
        workflowChangeCount: change.changeSource === 'workflow' ? 1 : 0,
        lastWorkflowChangeAt: change.changeSource === 'workflow' ? now : null,
      });
    } else {
      // Update existing summary
      const summary = existing[0];
      await this.db
        .update(propertyHistorySummary)
        .set({
          currentValue: change.newValue,
          currentTextValue: this.toTextValue(change.newValue),
          totalChanges: sql`${propertyHistorySummary.totalChanges} + 1`,
          lastValue: change.newValue,
          lastChangedAt: now,
          lastChangedById: change.changedBy?.id,
          workflowChangeCount: change.changeSource === 'workflow' 
            ? sql`${propertyHistorySummary.workflowChangeCount} + 1`
            : summary.workflowChangeCount,
          lastWorkflowChangeAt: change.changeSource === 'workflow' ? now : summary.lastWorkflowChangeAt,
          updatedAt: now,
        })
        .where(eq(propertyHistorySummary.id, summary.id));
    }
  }

  /**
   * Check and trigger workflows based on property changes
   */
  private async checkWorkflowTriggers(
    recordId: number,
    organizationId: number,
    changes: PropertyChange[]
  ): Promise<void> {
    // Get active triggers for these properties
    const propertyNames = changes.map(c => c.propertyName);
    
    const triggers = await this.db
      .select()
      .from(workflowPropertyTrigger)
      .where(
        and(
          eq(workflowPropertyTrigger.organizationId, organizationId),
          eq(workflowPropertyTrigger.isActive, true),
          sql`${workflowPropertyTrigger.propertyName} = ANY(${propertyNames})`
        )
      );

    for (const trigger of triggers) {
      const change = changes.find(c => c.propertyName === trigger.propertyName);
      if (!change) continue;

      // Check trigger conditions
      if (this.shouldTriggerWorkflow(trigger, change)) {
        // Check rate limiting
        if (await this.checkRateLimit(trigger)) {
          // Trigger the workflow (this would integrate with your workflow system)
          await this.triggerWorkflow(trigger, recordId, change);
          
          // Update trigger statistics
          await this.db
            .update(workflowPropertyTrigger)
            .set({
              totalTriggers: sql`${workflowPropertyTrigger.totalTriggers} + 1`,
              lastTriggeredAt: new Date(),
            })
            .where(eq(workflowPropertyTrigger.id, trigger.id));
        }
      }
    }
  }

  /**
   * Check if workflow should be triggered based on conditions
   */
  private shouldTriggerWorkflow(
    trigger: WorkflowPropertyTrigger,
    change: PropertyChange
  ): boolean {
    switch (trigger.triggerOn) {
      case 'any_change':
        return true;
      
      case 'value_equals':
        return JSON.stringify(change.newValue) === JSON.stringify(trigger.triggerValue);
      
      case 'value_contains':
        const newStr = String(change.newValue || '').toLowerCase();
        const triggerStr = String(trigger.triggerValue || '').toLowerCase();
        return newStr.includes(triggerStr);
      
      case 'value_increases':
        const oldNum = Number(change.oldValue);
        const newNum = Number(change.newValue);
        return !isNaN(oldNum) && !isNaN(newNum) && newNum > oldNum;
      
      case 'value_decreases':
        const oldNum2 = Number(change.oldValue);
        const newNum2 = Number(change.newValue);
        return !isNaN(oldNum2) && !isNaN(newNum2) && newNum2 < oldNum2;
      
      default:
        return false;
    }
  }

  /**
   * Check rate limiting for workflow trigger
   */
  private async checkRateLimit(trigger: WorkflowPropertyTrigger): Promise<boolean> {
    if (!trigger.cooldownSeconds && !trigger.maxTriggersPerHour && !trigger.maxTriggersPerDay) {
      return true; // No rate limiting
    }

    // Check cooldown
    if (trigger.cooldownSeconds && trigger.lastTriggeredAt) {
      const secondsSinceLastTrigger = Math.floor(
        (Date.now() - new Date(trigger.lastTriggeredAt).getTime()) / 1000
      );
      if (secondsSinceLastTrigger < Number(trigger.cooldownSeconds)) {
        return false;
      }
    }

    // TODO: Implement hourly/daily rate limiting with Redis or similar
    
    return true;
  }

  /**
   * Trigger a workflow
   */
  private async triggerWorkflow(
    trigger: WorkflowPropertyTrigger,
    recordId: number,
    change: PropertyChange
  ): Promise<void> {
    // TODO: Integrate with your workflow engine
    console.log(`Triggering workflow ${trigger.workflowId} for record ${recordId}`, {
      trigger,
      change,
      config: trigger.workflowConfig,
    });
  }

  /**
   * Helper: Infer property type from value
   */
  private inferPropertyType(value: any): string {
    if (value == null) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') {
      // Check if it's a date string
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
      return 'text';
    }
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'unknown';
  }

  /**
   * Helper: Convert value to text representation
   */
  private toTextValue(value: any): string | null {
    if (value == null) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * Helper: Convert value to numeric representation
   */
  private toNumericValue(value: any): string | null {
    if (value == null) return null;
    const num = Number(value);
    return isNaN(num) ? null : String(num);
  }

  /**
   * Helper: Convert value to date representation
   */
  private toDateValue(value: any): Date | null {
    if (value == null) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
}