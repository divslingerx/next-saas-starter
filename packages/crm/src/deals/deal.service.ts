import type { 
  PlatformService,
  ObjectRecord,
  PropertyChange 
} from '@charmlabs/platform';
import { 
  DEAL_OBJECT_DEFINITION, 
  type CreateDealInput, 
  type UpdateDealInput,
  type DealProperties,
  DEAL_STAGES 
} from './deal.schema';

/**
 * Deal Service - Business logic for deal management
 * Uses platform's flexible object system under the hood
 */
export class DealService {
  constructor(
    private platformService: PlatformService,
    private organizationId: number
  ) {}

  /**
   * Ensure deal object type exists
   */
  async initialize(): Promise<void> {
    await this.platformService.ensureObjectDefinition(
      'deal',
      DEAL_OBJECT_DEFINITION
    );
  }

  /**
   * Create a new deal
   */
  async createDeal(
    input: CreateDealInput,
    ownerId?: number
  ): Promise<ObjectRecord> {
    // Calculate default probability based on stage
    const stageConfig = DEAL_OBJECT_DEFINITION.pipelineStages?.stages.find(
      s => s.id === input.stage
    );
    
    const properties: DealProperties = {
      ...input,
      probability: input.probability ?? stageConfig?.probability ?? 0,
      closeDate: input.closeDate ?? this.getDefaultCloseDate(),
    };

    return await this.platformService.createRecord({
      objectType: 'deal',
      organizationId: this.organizationId,
      properties,
      ownerId,
    });
  }

  /**
   * Update a deal
   */
  async updateDeal(
    dealId: number,
    input: UpdateDealInput,
    updatedBy?: { id: number; name: string }
  ): Promise<ObjectRecord | null> {
    const propertyChanges: PropertyChange[] = [];
    
    // Special handling for stage changes
    if (input.stage) {
      const deal = await this.platformService.getRecord(dealId);
      if (deal) {
        const oldStage = (deal.properties as any).stage;
        
        // Track stage change for workflows
        if (oldStage !== input.stage) {
          propertyChanges.push({
            propertyName: 'stage',
            oldValue: oldStage,
            newValue: input.stage,
            changedBy: updatedBy ? { ...updatedBy, type: 'user' } : undefined,
            changeSource: 'ui',
            changeReason: this.getStageChangeReason(oldStage, input.stage),
          });

          // Auto-update probability based on new stage
          const stageConfig = DEAL_OBJECT_DEFINITION.pipelineStages?.stages.find(
            s => s.id === input.stage
          );
          if (stageConfig && !input.probability) {
            input.probability = stageConfig.probability;
          }

          // Handle won/lost logic
          if (input.stage === DEAL_STAGES.CLOSED_WON) {
            await this.handleDealWon(dealId, deal);
          } else if (input.stage === DEAL_STAGES.CLOSED_LOST) {
            await this.handleDealLost(dealId, deal);
          }
        }
      }
    }

    return await this.platformService.updateRecord(
      dealId,
      { properties: input },
      updatedBy ? { ...updatedBy, type: 'user' } : undefined
    );
  }

  /**
   * Get deals by stage
   */
  async getDealsByStage(stage: string): Promise<ObjectRecord[]> {
    return await this.platformService.searchRecords({
      objectType: 'deal',
      organizationId: this.organizationId,
      filters: [
        { property: 'stage', operator: 'eq', value: stage }
      ],
    });
  }

  /**
   * Get deals pipeline view
   */
  async getPipelineView(): Promise<Record<string, ObjectRecord[]>> {
    const allDeals = await this.platformService.searchRecords({
      objectType: 'deal',
      organizationId: this.organizationId,
      filters: [
        { property: 'stage', operator: 'ne', value: 'closed_lost' }
      ],
    });

    // Group by stage
    const pipeline: Record<string, ObjectRecord[]> = {};
    for (const stage of Object.values(DEAL_STAGES)) {
      pipeline[stage] = [];
    }

    for (const deal of allDeals.data) {
      const stage = (deal.properties as any).stage;
      if (pipeline[stage]) {
        pipeline[stage].push(deal);
      }
    }

    return pipeline;
  }

  /**
   * Calculate deal metrics
   */
  async getMetrics(dateRange?: { start: Date; end: Date }) {
    const deals = await this.platformService.searchRecords({
      objectType: 'deal',
      organizationId: this.organizationId,
    });

    const metrics = {
      totalDeals: deals.total,
      totalValue: 0,
      averageDealSize: 0,
      winRate: 0,
      averageCycleLength: 0,
      byStage: {} as Record<string, number>,
    };

    let wonDeals = 0;
    let lostDeals = 0;
    let totalCycleLength = 0;
    let cycleCount = 0;

    for (const deal of deals.data) {
      const props = deal.properties as any;
      
      // Total value
      if (props.amount) {
        metrics.totalValue += props.amount;
      }

      // Stage counts
      metrics.byStage[props.stage] = (metrics.byStage[props.stage] || 0) + 1;

      // Win rate
      if (props.stage === DEAL_STAGES.CLOSED_WON) {
        wonDeals++;
        
        // Cycle length (if we have close date and created date)
        if (props.closeDate && deal.createdAt) {
          const cycleLength = new Date(props.closeDate).getTime() - 
                             new Date(deal.createdAt).getTime();
          totalCycleLength += cycleLength;
          cycleCount++;
        }
      } else if (props.stage === DEAL_STAGES.CLOSED_LOST) {
        lostDeals++;
      }
    }

    // Calculate averages
    if (deals.total > 0) {
      metrics.averageDealSize = metrics.totalValue / deals.total;
    }

    const closedDeals = wonDeals + lostDeals;
    if (closedDeals > 0) {
      metrics.winRate = (wonDeals / closedDeals) * 100;
    }

    if (cycleCount > 0) {
      metrics.averageCycleLength = totalCycleLength / cycleCount / (1000 * 60 * 60 * 24); // Days
    }

    return metrics;
  }

  /**
   * Handle deal won
   */
  private async handleDealWon(dealId: number, deal: ObjectRecord): Promise<void> {
    // Create activity
    await this.platformService.createActivity({
      type: 'deal_won',
      category: 'crm',
      subjectType: 'deal',
      subjectId: dealId,
      title: `Deal won: ${(deal.properties as any).name}`,
      description: `Deal closed for ${(deal.properties as any).amount}`,
    });

    // Could trigger workflows here
    // Could create order if integrated with ecom
  }

  /**
   * Handle deal lost
   */
  private async handleDealLost(dealId: number, deal: ObjectRecord): Promise<void> {
    // Create activity
    await this.platformService.createActivity({
      type: 'deal_lost',
      category: 'crm',
      subjectType: 'deal',
      subjectId: dealId,
      title: `Deal lost: ${(deal.properties as any).name}`,
      description: `Lost reason: ${(deal.properties as any).lostReason || 'Not specified'}`,
    });
  }

  /**
   * Get stage change reason
   */
  private getStageChangeReason(oldStage: string, newStage: string): string {
    if (newStage === DEAL_STAGES.CLOSED_WON) {
      return 'Deal won';
    }
    if (newStage === DEAL_STAGES.CLOSED_LOST) {
      return 'Deal lost';
    }
    
    const oldIndex = Object.values(DEAL_STAGES).indexOf(oldStage as any);
    const newIndex = Object.values(DEAL_STAGES).indexOf(newStage as any);
    
    if (newIndex > oldIndex) {
      return 'Deal progressed';
    } else {
      return 'Deal moved back';
    }
  }

  /**
   * Get default close date (30 days from now)
   */
  private getDefaultCloseDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }
}