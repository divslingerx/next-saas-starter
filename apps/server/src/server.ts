import app from "./index";

const port = process.env.PORT || 4000;

console.log(`🚀 Server is running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};