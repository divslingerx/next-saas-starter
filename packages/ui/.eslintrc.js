module.exports = {
  extends: ["@charmlabs/config/eslint/base"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    // UI components may use any for flexibility
    "@typescript-eslint/no-explicit-any": "off",
  },
};