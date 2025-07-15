import baseConfig from "@charmlabs/eslint-config/base";
import reactConfig from "@charmlabs/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  ...baseConfig,
  ...reactConfig,
];
