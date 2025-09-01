/**
 * Platform API v1 Documentation Endpoint
 */

import { Hono } from "hono";
import { readFileSync } from "fs";
import { join } from "path";

const docs = new Hono();

// Serve documentation as markdown
docs.get('/', (c) => {
  try {
    const docsPath = join(__dirname, 'docs.md');
    const markdown = readFileSync(docsPath, 'utf-8');
    
    return c.text(markdown, 200, {
      'Content-Type': 'text/markdown'
    });
  } catch (error) {
    return c.json({
      error: 'Documentation not available',
      message: 'Could not load API documentation'
    }, 500);
  }
});

// Serve documentation as HTML (basic)
docs.get('/html', (c) => {
  try {
    const docsPath = join(__dirname, 'docs.md');
    const markdown = readFileSync(docsPath, 'utf-8');
    
    // Basic markdown to HTML conversion (just for headers and code blocks)
    const html = markdown
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Platform API v1 Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px auto; max-width: 800px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre code { background: none; padding: 0; }
    </style>
</head>
<body>
    <p>${html}</p>
</body>
</html>`;
    
    return c.html(fullHtml);
  } catch (error) {
    return c.html(`
<html>
<body>
    <h1>Error</h1>
    <p>Could not load API documentation</p>
</body>
</html>`, 500);
  }
});

// OpenAPI/Swagger spec (basic)
docs.get('/openapi.json', (c) => {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "ATK Platform API",
      version: "1.0.0",
      description: "HubSpot-inspired CRM API for managing platform objects"
    },
    servers: [
      {
        url: "/api/v1",
        description: "Production server"
      }
    ],
    paths: {
      "/objects/{objectType}": {
        get: {
          summary: "Get objects",
          parameters: [
            {
              name: "objectType",
              in: "path",
              required: true,
              schema: { type: "string" }
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", maximum: 100 }
            },
            {
              name: "after",
              in: "query",
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      results: { type: "array" },
                      paging: { type: "object" }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: "Create object",
          parameters: [
            {
              name: "objectType",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    properties: { type: "object" }
                  }
                }
              }
            }
          }
        }
      },
      "/clients": {
        get: {
          summary: "Get clients",
          responses: {
            "200": { description: "Success" }
          }
        },
        post: {
          summary: "Create client",
          responses: {
            "201": { description: "Created" }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session"
        }
      }
    },
    security: [
      { cookieAuth: [] }
    ]
  };
  
  return c.json(spec);
});

export { docs as platformDocsRoutes };