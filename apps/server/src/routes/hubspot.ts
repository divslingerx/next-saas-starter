import { Hono } from "hono";
import type { Client } from "@hubspot/api-client";
import type { Session } from "@tmcdm/auth/server";
import { requireAuth } from "../middleware/auth";
import { hubspotMiddleware, requireHubSpot, getHubSpotClient } from "../middleware/hubspot";

type Variables = {
  user: Session["user"] | null;
  session: Session["session"] | null;
  hubspotClient?: Client;
  hubspotAccessToken?: string;
};

const hubspotRoutes = new Hono<{ Variables: Variables }>();

// Apply HubSpot middleware to all routes
hubspotRoutes.use("*", requireAuth, hubspotMiddleware);

// Get all deals for the authenticated user
hubspotRoutes.get("/deals", requireHubSpot, async (c) => {
  try {
    const hubspotClient = getHubSpotClient(c);
    
    if (!hubspotClient) {
      return c.json({ 
        error: "HubSpot client not available" 
      }, 500);
    }

    // Get query parameters for pagination and filtering
    const limit = parseInt(c.req.query("limit") || "50");
    const after = c.req.query("after");
    const properties = c.req.query("properties")?.split(",") || [
      "dealname",
      "amount", 
      "closedate",
      "dealstage",
      "pipeline",
      "createdate",
      "hs_lastmodifieddate",
      "hubspot_owner_id"
    ];
    const archived = c.req.query("archived") === "true";

    // Fetch deals from HubSpot
    const dealsResponse = await hubspotClient.crm.deals.basicApi.getPage(
      limit,
      after,
      properties,
      undefined, // propertiesWithHistory
      undefined, // associations  
      archived
    );

    return c.json({
      success: true,
      deals: dealsResponse.results,
      paging: dealsResponse.paging,
      total: dealsResponse.results.length
    });

  } catch (error: any) {
    console.error("Error fetching HubSpot deals:", error);
    
    // Handle specific HubSpot API errors
    if (error.code === 401) {
      return c.json({ 
        error: "HubSpot authentication failed",
        message: "Your HubSpot session may have expired. Please reconnect your account."
      }, 401);
    }
    
    if (error.code === 403) {
      return c.json({ 
        error: "Insufficient permissions",
        message: "Your HubSpot account doesn't have permission to access deals."
      }, 403);
    }

    return c.json({ 
      error: "Failed to fetch deals",
      message: error.message || "An unexpected error occurred"
    }, 500);
  }
});

// Get a specific deal by ID
hubspotRoutes.get("/deals/:dealId", requireHubSpot, async (c) => {
  try {
    const hubspotClient = getHubSpotClient(c);
    const dealId = c.req.param("dealId");
    
    if (!hubspotClient) {
      return c.json({ 
        error: "HubSpot client not available" 
      }, 500);
    }

    const properties = c.req.query("properties")?.split(",") || [
      "dealname",
      "amount",
      "closedate", 
      "dealstage",
      "pipeline",
      "createdate",
      "hs_lastmodifieddate",
      "hubspot_owner_id",
      "description"
    ];

    const deal = await hubspotClient.crm.deals.basicApi.getById(
      dealId,
      properties,
      undefined, // propertiesWithHistory
      undefined, // associations
      false // archived
    );

    return c.json({
      success: true,
      deal
    });

  } catch (error: any) {
    console.error(`Error fetching deal ${c.req.param("dealId")}:`, error);
    
    if (error.code === 404) {
      return c.json({ 
        error: "Deal not found",
        message: `Deal with ID ${c.req.param("dealId")} was not found`
      }, 404);
    }

    return c.json({ 
      error: "Failed to fetch deal",
      message: error.message || "An unexpected error occurred"
    }, 500);
  }
});

// Search deals with filters
hubspotRoutes.post("/deals/search", requireHubSpot, async (c) => {
  try {
    const hubspotClient = getHubSpotClient(c);
    
    if (!hubspotClient) {
      return c.json({ 
        error: "HubSpot client not available" 
      }, 500);
    }

    const body = await c.req.json();
    
    // Build search request with sensible defaults
    const searchRequest = {
      filterGroups: body.filterGroups || [],
      sorts: body.sorts || [{ propertyName: "createdate", direction: "DESCENDING" }],
      properties: body.properties || [
        "dealname",
        "amount",
        "closedate",
        "dealstage",
        "pipeline"
      ],
      limit: body.limit || 100,
      after: body.after || 0
    };

    const searchResults = await hubspotClient.crm.deals.searchApi.doSearch(searchRequest);

    return c.json({
      success: true,
      results: searchResults.results,
      paging: searchResults.paging,
      total: searchResults.total
    });

  } catch (error: any) {
    console.error("Error searching HubSpot deals:", error);
    
    return c.json({ 
      error: "Failed to search deals",
      message: error.message || "An unexpected error occurred"
    }, 500);
  }
});

// Get all deals (convenience method that handles pagination internally)
hubspotRoutes.get("/deals/all", requireHubSpot, async (c) => {
  try {
    const hubspotClient = getHubSpotClient(c);
    
    if (!hubspotClient) {
      return c.json({ 
        error: "HubSpot client not available" 
      }, 500);
    }

    const properties = c.req.query("properties")?.split(",") || [
      "dealname",
      "amount",
      "closedate",
      "dealstage",
      "pipeline"
    ];

    // This method handles pagination internally
    const allDeals = await hubspotClient.crm.deals.getAll(
      undefined, // limit (undefined means get all)
      undefined, // after
      properties
    );

    return c.json({
      success: true,
      deals: allDeals,
      total: allDeals.length
    });

  } catch (error: any) {
    console.error("Error fetching all HubSpot deals:", error);
    
    return c.json({ 
      error: "Failed to fetch all deals",
      message: error.message || "An unexpected error occurred"
    }, 500);
  }
});

// Get object properties for any CRM object type
hubspotRoutes.get("/properties/:objectType", requireHubSpot, async (c) => {
  try {
    const objectType = c.req.param("objectType");
    console.log(`[HubSpot API] Fetching properties for object type: ${objectType}`);
    
    const hubspotClient = getHubSpotClient(c);
    
    if (!hubspotClient) {
      console.error("[HubSpot API] HubSpot client not available - user may not have HubSpot connected");
      return c.json({ 
        error: "HubSpot client not available",
        message: "Please ensure your HubSpot account is connected"
      }, 500);
    }

    // Validate object type
    const validObjectTypes = [
      "contacts",
      "companies", 
      "deals",
      "tickets",
      "products",
      "line_items",
      "quotes",
      "calls",
      "emails",
      "meetings",
      "notes",
      "tasks"
    ];

    if (!validObjectTypes.includes(objectType)) {
      return c.json({
        error: "Invalid object type",
        message: `Object type must be one of: ${validObjectTypes.join(", ")}`,
        validTypes: validObjectTypes
      }, 400);
    }

    // Use direct API request to get properties
    console.log(`[HubSpot API] Making request to: /crm/v3/properties/${objectType}`);
    const response = await hubspotClient.apiRequest({
      method: "GET",
      path: `/crm/v3/properties/${objectType}`
    });

    const properties = await response.json() as any;
    console.log(`[HubSpot API] Received ${properties.results?.length || 0} properties`);

    // Group properties by their group for better organization
    const groupedProperties = properties.results?.reduce((acc: any, prop: any) => {
      const groupName = prop.groupName || "ungrouped";
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push({
        name: prop.name,
        label: prop.label,
        type: prop.type,
        fieldType: prop.fieldType,
        description: prop.description,
        options: prop.options,
        calculated: prop.calculated,
        externalOptions: prop.externalOptions,
        hasUniqueValue: prop.hasUniqueValue,
        hidden: prop.hidden,
        modificationMetadata: prop.modificationMetadata
      });
      return acc;
    }, {});

    return c.json({
      success: true,
      objectType,
      totalProperties: properties.results?.length || 0,
      properties: properties.results,
      groupedProperties
    });

  } catch (error: any) {
    const objectType = c.req.param("objectType");
    console.error(`[HubSpot API] Error fetching properties for ${objectType}:`, error);
    console.error(`[HubSpot API] Error details:`, {
      message: error.message,
      response: error.response,
      code: error.code,
      body: error.body
    });
    
    return c.json({ 
      error: "Failed to fetch properties",
      message: error.message || "An unexpected error occurred",
      details: error.response?.body || error.body || null
    }, 500);
  }
});

// Get specific property details
hubspotRoutes.get("/properties/:objectType/:propertyName", requireHubSpot, async (c) => {
  try {
    const hubspotClient = getHubSpotClient(c);
    const objectType = c.req.param("objectType");
    const propertyName = c.req.param("propertyName");
    
    if (!hubspotClient) {
      return c.json({ 
        error: "HubSpot client not available" 
      }, 500);
    }

    // Use direct API request to get specific property
    const response = await hubspotClient.apiRequest({
      method: "GET",
      path: `/crm/v3/properties/${objectType}/${propertyName}`
    });

    const property = await response.json() as any;

    return c.json({
      success: true,
      property
    });

  } catch (error: any) {
    console.error(`Error fetching property ${c.req.param("propertyName")}:`, error);
    
    if (error.code === 404) {
      return c.json({ 
        error: "Property not found",
        message: `Property "${c.req.param("propertyName")}" not found for object type "${c.req.param("objectType")}"`
      }, 404);
    }
    
    return c.json({ 
      error: "Failed to fetch property",
      message: error.message || "An unexpected error occurred"
    }, 500);
  }
});

// Get deal pipelines (includes stages)
hubspotRoutes.get("/pipelines", requireHubSpot, async (c) => {
  try {
    const hubspotClient = getHubSpotClient(c);
    
    if (!hubspotClient) {
      return c.json({ 
        error: "HubSpot client not available" 
      }, 500);
    }

    // Optional: support getting pipelines for different object types
    const objectType = c.req.query("objectType") || "deals";
    const includeStages = c.req.query("includeStages") !== "false";

    // Use direct API request to get pipelines
    const response = await hubspotClient.apiRequest({
      method: "GET",
      path: `/crm/v3/pipelines/${objectType}`
    });

    const pipelinesData = await response.json() as any;

    // Process pipelines to include organized stage information
    const pipelines = pipelinesData.results?.map((pipeline: any) => {
      const processedPipeline: any = {
        id: pipeline.id,
        label: pipeline.label,
        displayOrder: pipeline.displayOrder,
        active: pipeline.archived === false,
        createdAt: pipeline.createdAt,
        updatedAt: pipeline.updatedAt
      };

      if (includeStages && pipeline.stages) {
        processedPipeline.stages = pipeline.stages
          .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
          .map((stage: any) => ({
            id: stage.id,
            label: stage.label,
            displayOrder: stage.displayOrder,
            metadata: stage.metadata,
            active: stage.archived === false,
            isClosed: stage.metadata?.isClosed || false,
            probability: stage.metadata?.probability
          }));
        processedPipeline.stageCount = processedPipeline.stages.length;
      }

      return processedPipeline;
    });

    return c.json({
      success: true,
      objectType,
      totalPipelines: pipelines?.length || 0,
      pipelines
    });

  } catch (error: any) {
    console.error("Error fetching pipelines:", error);
    
    return c.json({ 
      error: "Failed to fetch pipelines",
      message: error.message || "An unexpected error occurred"
    }, 500);
  }
});

// Get specific pipeline details
hubspotRoutes.get("/pipelines/:pipelineId", requireHubSpot, async (c) => {
  try {
    const hubspotClient = getHubSpotClient(c);
    const pipelineId = c.req.param("pipelineId");
    
    if (!hubspotClient) {
      return c.json({ 
        error: "HubSpot client not available" 
      }, 500);
    }

    const objectType = c.req.query("objectType") || "deals";

    // Use direct API request to get specific pipeline
    const response = await hubspotClient.apiRequest({
      method: "GET",
      path: `/crm/v3/pipelines/${objectType}/${pipelineId}`
    });

    const pipeline = await response.json() as any;

    // Process pipeline with organized stages
    const processedPipeline = {
      id: pipeline.id,
      label: pipeline.label,
      displayOrder: pipeline.displayOrder,
      active: pipeline.archived === false,
      createdAt: pipeline.createdAt,
      updatedAt: pipeline.updatedAt,
      stages: pipeline.stages
        ?.sort((a: any, b: any) => a.displayOrder - b.displayOrder)
        .map((stage: any) => ({
          id: stage.id,
          label: stage.label,
          displayOrder: stage.displayOrder,
          metadata: stage.metadata,
          active: stage.archived === false,
          isClosed: stage.metadata?.isClosed || false,
          probability: stage.metadata?.probability
        })),
      stageCount: pipeline.stages?.length || 0
    };

    return c.json({
      success: true,
      pipeline: processedPipeline
    });

  } catch (error: any) {
    console.error(`Error fetching pipeline ${c.req.param("pipelineId")}:`, error);
    
    if (error.code === 404) {
      return c.json({ 
        error: "Pipeline not found",
        message: `Pipeline with ID ${c.req.param("pipelineId")} was not found`
      }, 404);
    }
    
    return c.json({ 
      error: "Failed to fetch pipeline",
      message: error.message || "An unexpected error occurred"
    }, 500);
  }
});

// Get deals statistics/summary
hubspotRoutes.get("/deals/stats", requireHubSpot, async (c) => {
  try {
    const hubspotClient = getHubSpotClient(c);
    
    if (!hubspotClient) {
      return c.json({ 
        error: "HubSpot client not available" 
      }, 500);
    }

    // Fetch all deals with necessary properties for statistics
    const allDeals = await hubspotClient.crm.deals.getAll(
      undefined,
      undefined,
      ["amount", "dealstage", "closedate", "pipeline", "hs_is_closed_won"]
    );

    // Calculate statistics
    const stats = {
      totalDeals: allDeals.length,
      totalValue: 0,
      closedWonValue: 0,
      closedWonCount: 0,
      openDealsCount: 0,
      openDealsValue: 0,
      dealsByStage: {} as Record<string, number>,
      dealsByPipeline: {} as Record<string, number>
    };

    allDeals.forEach((deal: any) => {
      const amount = parseFloat(deal.properties.amount) || 0;
      const stage = deal.properties.dealstage || "unknown";
      const pipeline = deal.properties.pipeline || "unknown";
      const isClosedWon = deal.properties.hs_is_closed_won === "true";
      
      stats.totalValue += amount;
      
      if (isClosedWon) {
        stats.closedWonValue += amount;
        stats.closedWonCount++;
      } else {
        stats.openDealsCount++;
        stats.openDealsValue += amount;
      }
      
      stats.dealsByStage[stage] = (stats.dealsByStage[stage] || 0) + 1;
      stats.dealsByPipeline[pipeline] = (stats.dealsByPipeline[pipeline] || 0) + 1;
    });

    return c.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error("Error calculating deal statistics:", error);
    
    return c.json({ 
      error: "Failed to calculate statistics",
      message: error.message || "An unexpected error occurred"
    }, 500);
  }
});

export default hubspotRoutes;