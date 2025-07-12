/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  plugins: ["@typescript-eslint", "import"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: true,
  },
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_" 
      }
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { 
        prefer: "type-imports",
        fixStyle: "inline-type-imports" 
      }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: false,
      }
    ],
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling"],
          "index",
          "object",
          "type"
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true
        }
      }
    ],
  },
  ignorePatterns: [
    "**/*.config.js",
    "**/*.config.cjs",
    "**/*.config.mjs",
    ".eslintrc.js",
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage"
  ],
  reportUnusedDisableDirectives: true,
};