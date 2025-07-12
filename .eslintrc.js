module.exports = {
  root: true,
  extends: ["@charmlabs/config/eslint/base"],
  parserOptions: {
    project: ["./tsconfig.json", "./packages/*/tsconfig.json", "./apps/*/tsconfig.json"],
  },
};