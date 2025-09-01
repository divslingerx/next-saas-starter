import { createMiddleware } from "hono/factory";
import { auth } from "../../lib/auth";

export const requireAuth = createMiddleware<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>(async (c, next) => {
  const user = c.get("user");

  if (!user) {
    return c.redirect("/login", 301);
  }
  await next();
});
