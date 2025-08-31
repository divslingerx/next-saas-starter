export const DEFAULT_OBJECT_DEFINITIONS = [
  // Generic "entity" object - can be customized for any use case
  {
    internalName: "custom_entity",
    name: "Custom Entity",
    singularName: "Entity",
    pluralName: "Entities",
    description: "A flexible entity that can be customized for any purpose",
    icon: "box",
    color: "#6B7280",
    isSystem: false,
    displayProperty: "name",
    searchableProperties: ["name", "description"],
    features: {
      versioning: true,
      audit: true,
      workflow: true,
      customProperties: true,
      associations: true,
    },
    properties: {
      name: { type: "text", label: "Name", required: true },
      description: { type: "text", label: "Description", required: false },
      status: {
        type: "select",
        label: "Status",
        options: ["active", "inactive", "archived"],
        defaultValue: "active",
      },
    },
  },
];
