/**
 * Hono Context Types
 * Extends Hono's context with custom variables
 */

import type { Context } from "hono";

// Define the context variables that our middleware adds
export interface ContextVariables {
  organizationId: string;
  membershipId: string;
  userId?: string;
}

// Extended context type with our custom variables
export type AppContext = Context<{ Variables: ContextVariables }>;

// Helper type for route handlers
export type RouteHandler = (c: AppContext) => Promise<Response> | Response;