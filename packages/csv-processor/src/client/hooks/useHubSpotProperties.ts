import { useQuery } from "@tanstack/react-query";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export interface HubSpotProperty {
  name: string;
  label: string;
  type: string;
  fieldType: string;
  description?: string;
  groupName: string;
  options?: Array<{
    label: string;
    value: string;
    description?: string | null;
    displayOrder: number;
    hidden: boolean;
  }>;
  displayOrder?: number;
  calculated?: boolean;
  externalOptions?: boolean;
  hasUniqueValue?: boolean;
  hidden?: boolean;
  modificationMetadata?: {
    archivable: boolean;
    readOnlyDefinition: boolean;
    readOnlyValue: boolean;
  };
}

export function useHubSpotProperties(objectType: "deals" | "contacts" | "companies") {
  return useQuery({
    queryKey: ["hubspot-properties", objectType],
    queryFn: async () => {
      // Only log when actually fetching (not from cache)
      console.log(`[HubSpot] Fetching ${objectType} properties...`);
      
      try {
        const response = await fetch(`${SERVER_URL}/api/hubspot/properties/${objectType}`, {
          credentials: "include",
        });
        
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[HubSpot] Error response:`, errorText);
          
          // Try to parse as JSON for better error messages
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || errorJson.message || `Failed to fetch ${objectType} properties: ${response.status}`);
          } catch {
            throw new Error(`Failed to fetch ${objectType} properties: ${response.status} - ${errorText}`);
          }
        }
        
        const data = await response.json();
        
        // Handle the response format from our API
        const properties = data.properties || data.results || [];
        console.log(`[HubSpot] Successfully fetched ${properties.length} ${objectType} properties (cached for 30 minutes)`);
      
      // Transform the properties for the dropdown
      const propertyOptions = properties
        .filter((prop: HubSpotProperty) => !prop.hidden && !prop.calculated)
        .sort((a: HubSpotProperty, b: HubSpotProperty) => {
          // Simple A-Z sorting by label
          return a.label.localeCompare(b.label);
        })
        .map((prop: HubSpotProperty) => ({
          value: prop.name,
          label: prop.label,
          description: prop.description,
          type: prop.type,
          fieldType: prop.fieldType,
          groupName: prop.groupName,
        }));
      
      // Add "Do Not Import" option at the beginning
      return [
        { value: "Do Not Import", label: "Do Not Import", groupName: "Actions" },
        ...propertyOptions
      ];
      } catch (error) {
        console.error(`[HubSpot] Error in queryFn:`, error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch if data exists
    retry: 1,
    onError: (error: any) => {
      console.error(`[HubSpot] Query error:`, error);
      console.error(`[HubSpot] Error details:`, {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });
    },
  });
}