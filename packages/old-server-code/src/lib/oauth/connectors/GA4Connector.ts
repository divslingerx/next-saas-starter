import { BaseConnector } from '../core/BaseConnector';
import type { OAuth2Config, ServiceMetadata } from '../types';
import { z } from 'zod';

// GA4 specific configuration schema
export const ga4ConfigSchema = z.object({
  propertyIds: z.array(z.string()).default([]),
  dataStreamIds: z.array(z.string()).optional(),
  dimensions: z.array(z.string()).default(['date', 'country', 'deviceCategory']),
  metrics: z.array(z.string()).default([
    'activeUsers',
    'sessions',
    'screenPageViews',
    'engagementRate',
    'bounceRate',
  ]),
  dateRange: z.object({
    startDate: z.string().default('30daysAgo'),
    endDate: z.string().default('yesterday'),
  }).default(() => ({
    startDate: '30daysAgo',
    endDate: 'yesterday'
  })),
  samplingLevel: z.enum(['SMALL', 'DEFAULT', 'LARGE']).default('DEFAULT'),
});

export type GA4Config = z.infer<typeof ga4ConfigSchema>;

export class GA4Connector extends BaseConnector {
  readonly serviceName = 'Google Analytics 4';
  readonly authMethod = 'oauth2' as const;
  readonly scopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics.edit',
    'https://www.googleapis.com/auth/analytics.manage.users',
  ];

  readonly oauth2Config: OAuth2Config = {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/integrations/ga4/callback',
    scopes: this.scopes,
    usePKCE: true, // Google supports PKCE
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    },
  };

  static metadata = {
    name: 'Google Analytics 4',
    description: 'Connect to Google Analytics 4 for website and app analytics',
    icon: 'google-analytics',
    authMethod: 'oauth2' as const,
    configSchema: ga4ConfigSchema,
    documentationUrl: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
    capabilities: ['analytics', 'realtime', 'user-properties', 'custom-dimensions', 'audiences'],
  };

  private get config(): GA4Config {
    return ga4ConfigSchema.parse(this.connection.config || {});
  }

  async testConnection(): Promise<boolean> {
    if (!this.connection.oauthAccessToken) return false;

    try {
      const response = await this.makeAuthenticatedRequest(
        'https://analyticsadmin.googleapis.com/v1beta/accounts'
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async getMetadata(): Promise<ServiceMetadata> {
    if (!this.connection.oauthAccessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // Get user info
      const userResponse = await this.makeAuthenticatedRequest(
        'https://www.googleapis.com/oauth2/v2/userinfo'
      );
      const userData = await userResponse.json() as any;

      // Get account summaries
      const accountsResponse = await this.makeAuthenticatedRequest(
        'https://analyticsadmin.googleapis.com/v1beta/accountSummaries'
      );
      const accountsData = await accountsResponse.json() as any;

      return {
        serviceName: 'Google Analytics 4',
        serviceVersion: 'v1beta',
        accountId: userData.id,
        accountName: userData.email,
        permissions: this.scopes,
        limits: {
          rateLimit: 10000, // GA4 API quota
          quotaUsed: 0,
          quotaTotal: 10000,
        },
        lastSync: this.connection.updatedAt,
        syncStatus: 'active',
      };
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error}`);
    }
  }

  // GA4-specific methods
  async listProperties() {
    const response = await this.makeAuthenticatedRequest(
      'https://analyticsadmin.googleapis.com/v1beta/properties'
    );

    if (!response.ok) {
      throw new Error(`Failed to list properties: ${response.statusText}`);
    }

    return response.json();
  }

  async getProperty(propertyId: string) {
    const response = await this.makeAuthenticatedRequest(
      `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get property: ${response.statusText}`);
    }

    return response.json();
  }

  async listDataStreams(propertyId: string) {
    const response = await this.makeAuthenticatedRequest(
      `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}/dataStreams`
    );

    if (!response.ok) {
      throw new Error(`Failed to list data streams: ${response.statusText}`);
    }

    return response.json();
  }

  async runReport(propertyId: string, request?: any) {
    const defaultRequest = {
      dateRanges: [{
        startDate: this.config.dateRange.startDate || '30daysAgo',
        endDate: this.config.dateRange.endDate || 'yesterday',
      }],
      dimensions: this.config.dimensions.map(name => ({ name })),
      metrics: this.config.metrics.map(name => ({ name })),
    };

    const response = await this.makeAuthenticatedRequest(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request || defaultRequest),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to run report: ${error}`);
    }

    return response.json();
  }

  async runRealtimeReport(propertyId: string, request?: any) {
    const defaultRequest = {
      dimensions: [{ name: 'country' }, { name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
    };

    const response = await this.makeAuthenticatedRequest(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request || defaultRequest),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to run realtime report: ${error}`);
    }

    return response.json();
  }

  async batchRunReports(propertyId: string, requests: any[]) {
    const response = await this.makeAuthenticatedRequest(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to batch run reports: ${error}`);
    }

    return response.json();
  }

  async getPropertyMetadata(propertyId: string) {
    const response = await this.makeAuthenticatedRequest(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}/metadata`
    );

    if (!response.ok) {
      throw new Error(`Failed to get property metadata: ${response.statusText}`);
    }

    return response.json();
  }

  // Helper method to format GA4 date ranges
  formatDateRange(startDate: Date, endDate: Date): { startDate: string; endDate: string } {
    const format = (date: Date) => date.toISOString().split('T')[0] || date.toISOString();
    return {
      startDate: format(startDate),
      endDate: format(endDate),
    };
  }

  // Helper to build dimension filters
  buildDimensionFilter(dimension: string, operator: string, value: string) {
    return {
      filter: {
        fieldName: dimension,
        stringFilter: {
          matchType: operator,
          value: value,
        },
      },
    };
  }

  // Helper to build metric filters  
  buildMetricFilter(metric: string, operator: string, value: number) {
    return {
      filter: {
        fieldName: metric,
        numericFilter: {
          operation: operator,
          value: { doubleValue: value },
        },
      },
    };
  }
}