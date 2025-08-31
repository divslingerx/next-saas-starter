import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "@tmcdm/auth/server";
import type { Session } from "@tmcdm/auth/server";
import { authMiddleware, requireAuth, getUser } from "./middleware/auth";
import csvRoutes from "./routes/csv";
import hubspotRoutes from "./routes/hubspot";

// Local type definition
type ApiResponse = {
  message: string;
  success: boolean;
};

// Context variables type
type Variables = {
  user: Session["user"] | null;
  session: Session["session"] | null;
};

export const app = new Hono<{ Variables: Variables }>()

// Apply CORS specifically to auth routes first
.use(
  "/api/auth/*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Set-Cookie", "Content-Length"],
    maxAge: 600,
  })
)

// Apply CORS to all other routes
.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Set-Cookie"],
    maxAge: 86400,
  })
)

.on(["POST", "GET", "OPTIONS"], "/api/auth/*", async (c) => {
  // Handle OPTIONS for preflight
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }
  
  // Handle auth requests
  const response = await auth.handler(c.req.raw);
  return response;
})

.use("*", authMiddleware)

.get("/", (c) => {
	return c.text("Hello Hono!");
})

.get("/hello", async (c) => {
	const data: ApiResponse = {
		message: "Hello BHVR!",
		success: true,
	};

	return c.json(data, { status: 200 });
})

.get("/api/user", requireAuth, async (c) => {
	const user = getUser(c);
	return c.json({ user });
})

.get("/api/session", async (c) => {
	const user = getUser(c);
	const session = c.get("session");
	return c.json({ 
		authenticated: !!user,
		user,
		session
	});
})

.route("/api/csv", csvRoutes)
.route("/api/hubspot", hubspotRoutes);

export default app;