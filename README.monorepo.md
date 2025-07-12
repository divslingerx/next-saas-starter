# E-Commerce Platform Monorepo

This is a monorepo structure for building a headless e-commerce platform with a plugin-based architecture.

## Structure

```
├── apps/
│   └── web/                 # Next.js web application
├── packages/
│   ├── core/               # Core business logic and plugin system
│   ├── db/                 # Database schemas and migrations
│   ├── api/                # tRPC API layer
│   └── ui/                 # Shared UI components
├── plugins/                # Plugin packages
├── configs/                # Shared configurations
│   ├── eslint/            # ESLint configuration
│   └── typescript/        # TypeScript configurations
└── tools/                  # Build and development tools
```

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Set up your environment:
```bash
cp .env.example .env
# Fill in your environment variables
```

3. Start the database:
```bash
docker-compose up -d postgres
```

4. Run migrations:
```bash
pnpm db:migrate
```

5. Start development:
```bash
pnpm dev
```

## Package Development

### Creating a New Package

1. Create a new directory under `packages/`
2. Add a `package.json` with the name format `@ecom/package-name`
3. Add the package to dependent packages using `workspace:*`

### Creating a New Plugin

1. Create a new directory under `plugins/`
2. Use the plugin template structure
3. Export a default function using `definePlugin`

## Available Scripts

- `pnpm dev` - Start the web app in development mode
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm typecheck` - Type check all packages
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

## Dependencies Between Packages

- `@ecom/api` depends on `@ecom/db` and `@ecom/core`
- `@ecom/core` depends on `@ecom/db`
- `web` app depends on all packages
- Plugins depend on `@ecom/core` and optionally other plugins