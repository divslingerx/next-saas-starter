import type { PlatformService } from '@charmlabs/platform';
import { DEAL_OBJECT_DEFINITION } from '../deals/deal.schema';

/**
 * CRM Setup Service
 * Initializes all CRM-specific object types and configurations
 */
export class CRMSetupService {
  constructor(private platformService: PlatformService) {}

  /**
   * Initialize all CRM objects and configurations
   */
  async setupCRM(organizationId: number): Promise<void> {
    console.log('🚀 Setting up CRM for organization', organizationId);

    // Create CRM object definitions
    await this.createCRMObjects();
    
    // Create default pipelines
    await this.createDefaultPipelines();
    
    // Create default properties
    await this.createDefaultProperties();
    
    // Set up default workflows
    await this.createDefaultWorkflows();

    console.log('✅ CRM setup complete');
  }

  /**
   * Create CRM-specific object types
   */
  private async createCRMObjects(): Promise<void> {
    // Deal object
    await this.platformService.ensureObjectDefinition('deal', DEAL_OBJECT_DEFINITION);

    // Lead object (lighter than contact)
    await this.platformService.ensureObjectDefinition('lead', {
      internalName: 'lead',
      displayName: 'Lead',
      pluralName: 'Leads',
      description: 'Potential customers who have shown interest',
      icon: 'user-plus',
      color: '#f59e0b',
      requiredProperties: ['email'],
      searchableProperties: ['email', 'name', 'company'],
      features: {
        versioning: true,
        audit: true,
        workflow: true,
        scoring: true,
      },
    });

    // Task object
    await this.platformService.ensureObjectDefinition('task', {
      internalName: 'task',
      displayName: 'Task',
      pluralName: 'Tasks',
      description: 'Tasks and to-dos',
      icon: 'check-square',
      color: '#6366f1',
      requiredProperties: ['title', 'status'],
      searchableProperties: ['title', 'description'],
      features: {
        versioning: false,
        audit: true,
        workflow: true,
        reminders: true,
      },
    });

    // Meeting object
    await this.platformService.ensureObjectDefinition('meeting', {
      internalName: 'meeting',
      displayName: 'Meeting',
      pluralName: 'Meetings',
      description: 'Scheduled meetings and calls',
      icon: 'calendar',
      color: '#8b5cf6',
      requiredProperties: ['title', 'startTime'],
      searchableProperties: ['title', 'description', 'location'],
      features: {
        versioning: false,
        audit: true,
        workflow: true,
        reminders: true,
        calendar: true,
      },
    });

    // Note object
    await this.platformService.ensureObjectDefinition('note', {
      internalName: 'note',
      displayName: 'Note',
      pluralName: 'Notes',
      description: 'Notes and comments',
      icon: 'file-text',
      color: '#64748b',
      requiredProperties: ['content'],
      searchableProperties: ['content'],
      features: {
        versioning: true,
        audit: true,
        workflow: false,
      },
    });
  }

  /**
   * Create default sales pipelines
   */
  private async createDefaultPipelines(): Promise<void> {
    // Default sales pipeline is defined in DEAL_OBJECT_DEFINITION
    // Additional pipelines can be created here
    
    // Example: Enterprise pipeline
    await this.platformService.ensureObjectDefinition('deal_enterprise', {
      internalName: 'deal_enterprise',
      displayName: 'Enterprise Deal',
      pluralName: 'Enterprise Deals',
      description: 'Enterprise sales opportunities',
      icon: 'building',
      color: '#dc2626',
      hasPipeline: true,
      pipelineStages: {
        stages: [
          { id: 'discovery', label: 'Discovery', order: 1, probability: 10 },
          { id: 'qualification', label: 'Qualification', order: 2, probability: 20 },
          { id: 'technical_review', label: 'Technical Review', order: 3, probability: 30 },
          { id: 'business_case', label: 'Business Case', order: 4, probability: 40 },
          { id: 'stakeholder_buy_in', label: 'Stakeholder Buy-in', order: 5, probability: 50 },
          { id: 'procurement', label: 'Procurement', order: 6, probability: 60 },
          { id: 'legal_review', label: 'Legal Review', order: 7, probability: 70 },
          { id: 'negotiation', label: 'Negotiation', order: 8, probability: 80 },
          { id: 'closed_won', label: 'Closed Won', order: 9, probability: 100, isWon: true },
          { id: 'closed_lost', label: 'Closed Lost', order: 10, probability: 0, isLost: true },
        ]
      },
    });
  }

  /**
   * Create default custom properties for CRM objects
   */
  private async createDefaultProperties(): Promise<void> {
    // Deal properties
    const dealProperties = [
      {
        name: 'competitor_analysis',
        label: 'Competitor Analysis',
        type: 'text',
        groupName: 'Competition',
      },
      {
        name: 'budget_confirmed',
        label: 'Budget Confirmed',
        type: 'boolean',
        groupName: 'Qualification',
      },
      {
        name: 'decision_criteria',
        label: 'Decision Criteria',
        type: 'text',
        groupName: 'Qualification',
      },
      {
        name: 'champion_identified',
        label: 'Champion Identified',
        type: 'boolean',
        groupName: 'Stakeholders',
      },
    ];

    for (const prop of dealProperties) {
      await this.platformService.createProperty('deal', prop);
    }

    // Lead properties
    const leadProperties = [
      {
        name: 'lead_source',
        label: 'Lead Source',
        type: 'select',
        options: [
          { value: 'website', label: 'Website' },
          { value: 'referral', label: 'Referral' },
          { value: 'social_media', label: 'Social Media' },
          { value: 'email_campaign', label: 'Email Campaign' },
          { value: 'trade_show', label: 'Trade Show' },
          { value: 'cold_call', label: 'Cold Call' },
        ],
      },
      {
        name: 'lead_score',
        label: 'Lead Score',
        type: 'number',
        description: 'Automated lead scoring value',
      },
      {
        name: 'marketing_qualified',
        label: 'Marketing Qualified',
        type: 'boolean',
      },
      {
        name: 'sales_qualified',
        label: 'Sales Qualified',
        type: 'boolean',
      },
    ];

    for (const prop of leadProperties) {
      await this.platformService.createProperty('lead', prop);
    }
  }

  /**
   * Create default CRM workflows
   */
  private async createDefaultWorkflows(): Promise<void> {
    // Deal stage change workflow
    await this.platformService.createWorkflowTrigger({
      name: 'Deal Stage Changed',
      description: 'Trigger when deal moves to new stage',
      objectType: 'deal',
      propertyName: 'stage',
      triggerOn: 'any_change',
      workflowId: 'deal_stage_workflow',
      workflowConfig: {
        actions: [
          { type: 'send_notification', to: 'owner' },
          { type: 'create_activity', activityType: 'stage_change' },
        ],
      },
    });

    // Deal won workflow
    await this.platformService.createWorkflowTrigger({
      name: 'Deal Won',
      description: 'Trigger when deal is won',
      objectType: 'deal',
      propertyName: 'stage',
      triggerOn: 'value_equals',
      triggerValue: 'closed_won',
      workflowId: 'deal_won_workflow',
      workflowConfig: {
        actions: [
          { type: 'send_email', template: 'deal_won_notification' },
          { type: 'create_task', title: 'Schedule kickoff call' },
          { type: 'update_contact', properties: { lifecycle_stage: 'customer' } },
        ],
      },
    });

    // Lead scoring workflow
    await this.platformService.createWorkflowTrigger({
      name: 'High Value Lead',
      description: 'Trigger when lead score exceeds threshold',
      objectType: 'lead',
      propertyName: 'lead_score',
      triggerOn: 'value_increases',
      triggerOperator: 'greater_than',
      triggerValue: 70,
      workflowId: 'high_value_lead_workflow',
      workflowConfig: {
        actions: [
          { type: 'assign_to_sales', priority: 'high' },
          { type: 'send_notification', to: 'sales_team' },
          { type: 'create_task', title: 'Contact high-value lead within 1 hour' },
        ],
      },
    });
  }
}