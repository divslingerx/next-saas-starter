# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a T3 Turbo monorepo - a full-stack TypeScript SaaS application with modular domain packages. The architecture separates infrastructure (platform) from domain-specific logic (CRM, e-commerce, marketing).

## Tech Stack

- **Framework**: Next.js 15.3.3 with App Router, React 19, TypeScript 5.8.3 (strict mode)
- **Database**: PostgreSQL with Drizzle ORM (snake_case naming, "agency-app_" table prefix)
- **Authentication**: Better Auth with extensive plugins (2FA, passkeys, organizations, Stripe)
- **API**: tRPC v11 with type-safe routers
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Package Manager**: pnpm 10.11.1 (Node >=22.14.0 required)
- **Build System**: Turborepo for monorepo orchestration

## Monorepo Structure

```
/apps
  /web              # Next.js 15 web application
  /expo             # React Native mobile app (SDK 53)
/packages
  /admin            # Admin panel components
  /api              # tRPC API layer with routers
  /auth             # Better Auth configuration
  /core             # Core business logic and plugin system
  /crm              # CRM domain functionality
  /db               # Database layer (Drizzle ORM)
  /ecom             # E-commerce functionality  
  /email            # Email domain functionality
  /marketing        # Marketing domain functionality
  /platform         # Core platform infrastructure (identity, objects, audit)
  /ui               # Shared UI components (shadcn/ui)
  /validators       # Shared Zod validation schemas
/tooling            # Development tooling configurations
```

## Architecture Patterns

### Domain-Driven Design
- **Platform Package** (`/packages/platform`): Core infrastructure providing identity management, flexible object system, property history, and associations
- **Domain Packages** (CRM, Ecom, Marketing, Email): Build on platform foundation with domain-specific logic
- Each domain package follows service/repository pattern

### API Structure
- tRPC routers in `/packages/api/src/routers/`
- Root router: `/packages/api/src/root.ts`
- Context with auth middleware: `/packages/api/src/trpc.ts`
- Protected procedures access user via `ctx.session.user`

### Authentication
- Better Auth config in `/packages/core/src/auth/auth.ts` (full-featured)
- Simpler expo-compatible config in `/packages/auth/src/index.ts`
- OAuth providers: Google, GitHub, Discord, Twitter, Microsoft, Twitch, Facebook
- Stripe integration for subscriptions

### Database
- Drizzle config: `/packages/db/drizzle.config.ts`
- Snake case naming convention
- Tables prefixed with "agency-app_"
- Auth tables managed by Better Auth (do not modify)

## Essential Commands

### Development
```bash
pnpm dev                      # Start web app in dev mode (turbopack)
pnpm dev:next                 # Start Next.js with all dependencies
pnpm dev:all                  # Start all apps in dev mode
docker-compose up -d postgres # Start local PostgreSQL
```

### Database
```bash
pnpm db:generate              # Generate Drizzle migrations
pnpm db:migrate               # Run migrations  
pnpm db:push                  # Push schema changes directly
pnpm db:studio                # Open Drizzle Studio GUI
pnpm auth:generate            # Generate Better Auth schema
```

### Code Quality
```bash
pnpm typecheck               # TypeScript type checking
pnpm lint                    # Run ESLint
pnpm lint:fix                # Auto-fix linting issues
pnpm format                  # Check Prettier formatting
pnpm format:fix              # Apply Prettier formatting
pnpm lint:ws                 # Check workspace dependencies
```

### Build & Clean
```bash
pnpm build                   # Build all packages/apps
pnpm clean                   # Clean all node_modules
pnpm clean:workspaces        # Clean build artifacts
```

### UI & Packages
```bash
pnpm ui-add                  # Add shadcn/ui components interactively
pnpm turbo gen init          # Create new package with boilerplate
```

## Development Workflow

1. **Environment Setup**
   - Copy `.env.example` to `.env` and configure values
   - Start PostgreSQL: `docker-compose up -d postgres`
   - Database URL format: `postgresql://postgres:DSm3bB27AXzlznDA@localhost:5432/agency-app`

2. **Initial Setup**
   ```bash
   pnpm install
   pnpm auth:generate
   pnpm db:migrate
   pnpm dev
   ```

3. **Adding Features**
   - Domain logic goes in appropriate package (`/packages/crm`, `/packages/ecom`, etc.)
   - Use platform package for shared infrastructure
   - Add tRPC routers to `/packages/api/src/routers/`
   - Register routers in `/packages/api/src/root.ts`

## Code Patterns

### tRPC Usage
```typescript
// Client-side
import { api } from "@/trpc/react";
const { data } = api.example.hello.useQuery();

// Server-side  
import { api } from "@/trpc/server";
const data = await api.example.hello();
```

### Cross-Package Imports
- Workspace protocol: `"@charmlabs/package": "workspace:*"`
- All packages use `@charmlabs/*` namespace (replaceable)

### Forms
- Define schemas in `/packages/validators/src/`
- Use React Hook Form with zodResolver
- Server actions use `schema.parse()` for validation

## Docker Services

- **PostgreSQL**: Port 5432, credentials in docker-compose.yml
- **MinIO**: S3-compatible storage, ports 9000 (API) and 9001 (console)

## Environment Variables

Key variables (see `.env.example` for full list):
- `DATABASE_URL` / `POSTGRES_URL`: PostgreSQL connection
- `BETTER_AUTH_*`: Authentication configuration
- OAuth provider credentials
- `STRIPE_*`: Payment processing
- `RESEND_API_KEY`: Email service
- `MINIO_*`: Object storage configuration