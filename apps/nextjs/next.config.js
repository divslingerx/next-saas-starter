import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@charmlabs/api",
    "@charmlabs/auth",
    "@charmlabs/db",
    "@charmlabs/ui",
    "@charmlabs/validators",
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  /** Multi-zone configuration */
  async rewrites() {
    return [
      {
        source: "/admin",
        destination: `${process.env.ADMIN_URL || "http://localhost:3001"}/admin`,
      },
      {
        source: "/admin/:path*",
        destination: `${process.env.ADMIN_URL || "http://localhost:3001"}/admin/:path*`,
      },
    ];
  },
};

export default config;
