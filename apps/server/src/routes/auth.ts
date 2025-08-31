import { Hono } from "hono";
import { authClient } from "../lib/auth";

const app = new Hono();

/**
 * Mount Better Auth routes
 * This handles all auth endpoints like /api/auth/sign-in, /api/auth/sign-up, etc.
 */
app.all("/auth/*", (c) => {
  return authClient.handler(c.req.raw);
});

/**
 * Example protected route
 */
app.get("/me", async (c) => {
  const session = await authClient.api.getSession({
    headers: c.req.raw.headers,
  });
  
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  return c.json({
    user: session.user,
    session: session.session,
  });
});

/**
 * Example route to get user's organizations
 */
app.get("/my-organizations", async (c) => {
  const session = await authClient.api.getSession({
    headers: c.req.raw.headers,
  });
  
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  // If using organization plugin
  const organizations = await authClient.api.listOrganizations({
    headers: c.req.raw.headers,
  });
  
  return c.json(organizations);
});

export default app;