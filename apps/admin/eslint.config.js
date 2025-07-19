import baseConfig, { restrictEnvAccess } from "@charmlabs/eslint-config/base";
import nextjsConfig from "@charmlabs/eslint-config/nextjs";
import reactConfig from "@charmlabs/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
