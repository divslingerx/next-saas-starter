import { pgTableCreator } from "drizzle-orm/pg-core";

// Function to create a table creator with a custom prefix
export const makeTableCreator = (prefix = "app_") => {
  return pgTableCreator(
    (name) => `${prefix}${prefix.endsWith("_") ? "" : "_"}${name}`,
  );
};

// Default table creator using the "app_" prefix
export const createAppTable = makeTableCreator();
