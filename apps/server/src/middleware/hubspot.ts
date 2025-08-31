import type { Context, Next } from "hono";
import { auth } from "@tmcdm/auth/server";
import { Client } from "@hubspot/api-client";

export interface HubSpotContext {
  hubspotClient?: Client;
  hubspotAccessToken?: string;
}

export async function hubspotMiddleware(c: Context, next: Next) {
  try {
    const session = c.get("session");
    const user = c.get("user");

    if (!session || !user) {
      c.set("hubspotClient", undefined);
      c.set("hubspotAccessToken", undefined);
      await next();
      return;
    }

    // Get the HubSpot access token for this user
    const tokenResponse = await auth.api.getAccessToken({
      body: {
        providerId: "hubspot",
        userId: user.id,
      },
      headers: c.req.raw.headers,
    });

    if (!tokenResponse?.accessToken) {
      c.set("hubspotClient", undefined);
      c.set("hubspotAccessToken", undefined);
      console.warn("No HubSpot access token found for user:", user.id);
      await next();
      return;
    }

    // Create HubSpot client with the access token
    const hubspotClient = new Client({
      accessToken: tokenResponse.accessToken,
      numberOfApiCallRetries: 3,
    });

    // Set the client and token in context for use in routes
    c.set("hubspotClient", hubspotClient);
    c.set("hubspotAccessToken", tokenResponse.accessToken);

    await next();
  } catch (error) {
    console.error("HubSpot middleware error:", error);
    // Don't block the request, just set undefined values
    c.set("hubspotClient", undefined);
    c.set("hubspotAccessToken", undefined);
    await next();
  }
}

export function requireHubSpot(c: Context, next: Next) {
  const hubspotClient = c.get("hubspotClient");

  if (!hubspotClient) {
    return c.json(
      {
        error: "HubSpot authentication required",
        message: "Please connect your HubSpot account to access this resource",
      },
      403
    );
  }

  return next();
}

export function getHubSpotClient(c: Context): Client | undefined {
  return c.get("hubspotClient");
}
