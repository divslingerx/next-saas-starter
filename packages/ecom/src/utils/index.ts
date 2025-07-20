import { createAppTable } from "@charmlabs/db/utils";

// Export the default createTable function for ecom package
// This uses the app_ prefix by default but can be easily changed if needed
export const createTable = createAppTable;
