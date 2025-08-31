/**
 * Example of how domain packages can define their objects
 */
export const EXAMPLE_DOMAIN_OBJECTS = {
  // CRM Package would define:
  crm: ["contact", "company", "deal", "lead", "task", "meeting", "note"],

  // Ecommerce Package would define:
  ecom: ["product", "order", "cart", "customer", "discount", "inventory"],

  // Project Management Package would define:
  project: ["project", "milestone", "issue", "sprint", "team", "resource"],

  // HR Package would define:
  hr: [
    "employee",
    "candidate",
    "position",
    "department",
    "leave_request",
    "performance_review",
  ],
};
