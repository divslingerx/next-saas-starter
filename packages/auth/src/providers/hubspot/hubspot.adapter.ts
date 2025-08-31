import { genericOAuth } from "better-auth/plugins";
import type { GenericOAuthConfig } from "better-auth/plugins/generic-oauth";

/**
 * HubSpot OAuth Provider Configuration for Better Auth
 *
 * This provider implements HubSpot's OAuth 2.0 flow with configurable scopes
 * for accessing CRM objects and other HubSpot APIs.
 */

export interface HubSpotOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  scopes?: string[];
}

// Default scopes for HubSpot OAuth
export const DEFAULT_HUBSPOT_SCOPES = [
  "crm.objects.contacts.read",
  "crm.objects.contacts.write",
  "crm.objects.companies.read",
  "crm.objects.companies.write",
  "crm.schemas.deals.read",
  "crm.objects.deals.write",
  "crm.objects.deals.read",
  "crm.objects.owners.read",
  "oauth",
  "crm.objects.custom.read",
  "crm.objects.custom.write",
];

// Additional available scopes that can be requested
export const AVAILABLE_HUBSPOT_SCOPES = {
  // CRM Object Scopes
  contacts: {
    read: "crm.objects.contacts.read",
    write: "crm.objects.contacts.write",
  },
  companies: {
    read: "crm.objects.companies.read",
    write: "crm.objects.companies.write",
  },
  deals: {
    read: "crm.objects.deals.read",
    write: "crm.objects.deals.write",
  },
  tickets: {
    read: "crm.objects.tickets.read",
    write: "crm.objects.tickets.write",
  },
  products: {
    read: "crm.objects.line_items.read",
    write: "crm.objects.line_items.write",
  },
  quotes: {
    read: "crm.objects.quotes.read",
    write: "crm.objects.quotes.write",
  },
  custom: {
    read: "crm.objects.custom.read",
    write: "crm.objects.custom.write",
  },

  oauth: "oauth",

  // CRM Lists & Schemas
  lists: {
    read: "crm.lists.read",
    write: "crm.lists.write",
  },
  schemas: {
    contacts: {
      read: "crm.schemas.contacts.read",
      write: "crm.schemas.contacts.write",
    },
    companies: {
      read: "crm.schemas.companies.read",
      write: "crm.schemas.companies.write",
    },
    deals: {
      read: "crm.schemas.deals.read",
      write: "crm.schemas.deals.write",
    },
    pipelines: {
      read: "crm.pipelines.read",
      write: "crm.pipelines.write",
    },
    custom: {
      read: "crm.schemas.custom.read",
      write: "crm.schemas.custom.write",
    },
  },

  // Other Scopes
  owners: "crm.objects.owners.read",

  timeline: "timeline",
  forms: "forms",
  files: "files",
  hubdbApi: "hubdb",
  communicationPreferences: "communication_preferences.read_write",
  contentMembership: "content.membership.read_write",
};

/**
 * Creates a HubSpot OAuth provider configuration for Better Auth
 *
 * @param config - HubSpot OAuth configuration
 * @returns GenericOAuth configuration for Better Auth
 */
export function createHubSpotProvider(
  config: HubSpotOAuthConfig
): GenericOAuthConfig {
  const scopes = config.scopes || DEFAULT_HUBSPOT_SCOPES;

  return {
    providerId: "hubspot",
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authorizationUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    userInfoUrl: "https://api.hubapi.com/oauth/v1/access-tokens",
    redirectURI: config.redirectUri,
    scopes: scopes,
    responseType: "code",
    // Add PKCE support which HubSpot might require
    pkce: false,

    // Custom function to fetch user information from HubSpot
    getUserInfo: async (tokens) => {
      try {
        // First, get the access token info to retrieve the user email
        const tokenInfoResponse = await fetch(
          `https://api.hubapi.com/oauth/v1/access-tokens/${tokens.accessToken}`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );

        if (!tokenInfoResponse.ok) {
          throw new Error(
            `Failed to fetch token info: ${tokenInfoResponse.statusText}`
          );
        }

        const tokenInfo: any = await tokenInfoResponse.json();

        // Get user details using the owners API
        const ownersResponse = await fetch(
          `https://api.hubapi.com/crm/v3/owners?email=${tokenInfo.user}`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );

        let userName = tokenInfo.user;
        let userId = tokenInfo.user_id || tokenInfo.hub_id?.toString();

        if (ownersResponse.ok) {
          const ownersData: any = await ownersResponse.json();
          if (ownersData.results && ownersData.results.length > 0) {
            const owner = ownersData.results[0];
            userName =
              `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
              tokenInfo.user;
            userId = owner.id || userId;
          }
        }

        return {
          id: userId,
          email: tokenInfo.user,
          name: userName,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          raw: {
            ...tokenInfo,
            hubId: tokenInfo.hub_id,
            hubDomain: tokenInfo.hub_domain,
            appId: tokenInfo.app_id,
            tokenType: tokenInfo.token_type,
            scopes: tokenInfo.scopes,
          },
        };
      } catch (error) {
        console.error("Error fetching HubSpot user info:", error);
        throw error;
      }
    },

    // Map HubSpot profile to Better Auth user
    mapProfileToUser: (profile) => {
      return {
        email: profile.email,
        name: profile.name,
        emailVerified: profile.emailVerified || false,
      };
    },
  };
}

/**
 * Creates the Better Auth plugin configuration for HubSpot OAuth
 *
 * @param config - HubSpot OAuth configuration
 * @returns genericOAuth plugin configuration
 */
export function hubspotOAuthPlugin(config: HubSpotOAuthConfig) {
  const provider = createHubSpotProvider(config);
  
  return genericOAuth({
    config: [provider],
  });
}
