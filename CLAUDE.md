# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a T3 Turbo monorepo - a full-stack TypeScript SaaS starter with e-commerce capabilities. It includes:
- **Web App**: Next.js 15 with App Router
- **Mobile App**: React Native with Expo
- **Shared Packages**: UI components, API layer, database, authentication, and more

## Tech Stack

- **Framework**: Next.js 15.2.3 with App Router and React 19
- **Language**: TypeScript 5.8.3 with strict mode
- **Authentication**: Better Auth with extensive plugin ecosystem
- **Database**: PostgreSQL with Drizzle ORM
- **API Layer**: tRPC v11 for type-safe APIs
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query v5
- **Payments**: Stripe integration via Better Auth plugin
- **Email**: Resend with React Email templates
- **Package Manager**: pnpm 10.11.1 (strict version requirements)
- **Build System**: Turborepo for monorepo orchestration

## Monorepo Structure

```
/apps
  /web              # Next.js web application
  /expo             # React Native mobile app
/packages
  /admin            # Admin panel components
  /api              # tRPC API layer
  /auth             # Better Auth configuration
  /core             # Core business logic and plugin system
  /db               # Database layer (Drizzle ORM)
  /ecom             # E-commerce functionality
  /ui               # Shared UI components (shadcn/ui)
  /validators       # Shared Zod validation schemas
/tooling            # Development tooling configurations
```

## Key Commands

### Development
```bash
pnpm dev              # Start all apps in development mode
pnpm dev:next         # Start only Next.js web app
pnpm build            # Build all packages/apps
pnpm clean            # Clean all node_modules
pnpm android          # Run Expo app on Android
pnpm ios              # Run Expo app on iOS
```

### Database
```bash
docker-compose up -d postgres  # Start local PostgreSQL
pnpm db:generate              # Generate Drizzle migrations
pnpm db:migrate               # Run migrations
pnpm db:push                  # Push schema changes directly
pnpm db:studio                # Open Drizzle Studio GUI
```

### Code Quality
```bash
pnpm typecheck        # TypeScript type checking
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Check Prettier formatting
pnpm format:fix       # Apply Prettier formatting
pnpm lint:ws          # Check workspace dependencies
```

### Authentication
```bash
pnpm auth:generate    # Generate Better Auth database schema
```

### UI Components
```bash
pnpm ui-add           # Add new shadcn/ui components
```

## Architecture Overview

### Authentication System
- Configured in `apps/web/src/lib/auth.ts` with Better Auth
- Supports multiple OAuth providers (Google, GitHub, Discord, Twitter, Microsoft, Twitch, Facebook)
- Features: 2FA, passkeys, organizations, email verification, password reset, session management
- Custom auth pages in `/apps/web/src/app/(auth)/` with server-side redirect handling

### API Structure
- tRPC routers in `/packages/api/src/routers/`
- Root router configuration in `/packages/api/src/root.ts`
- Context creation in `/packages/api/src/trpc.ts` with auth middleware
- Public and protected procedures with session validation

### Database Schema
- Tables use prefix configured in Drizzle
- Auth tables defined by Better Auth (do not modify directly)
- Application tables in `/packages/db/src/schema/`
- Database client in `/packages/db/src/client.ts`

### Component Architecture
- UI components in `/packages/ui/src/` (shadcn/ui based)
- Feature components organized by domain in apps
- Server Components by default, Client Components marked with "use client"
- Form components use React Hook Form with Zod schemas

### Environment Variables
- Validated in `/apps/web/src/env.js` using @t3-oss/env-nextjs
- Required variables defined with Zod schemas
- `.env.example` contains all required variables template
- Includes OAuth providers, database URL, email service, and storage configuration

## Development Workflow

1. Ensure PostgreSQL is running: `docker-compose up -d postgres`
2. Set up environment variables: Copy `.env.example` to `.env` and fill in values
3. Generate auth schema: `pnpm auth:generate`
4. Run database migrations: `pnpm db:migrate`
5. Start development: `pnpm dev`
6. Before committing: `pnpm typecheck && pnpm lint`

## Important Patterns

### tRPC Usage
```typescript
// Client-side (in components)
import { api } from "@/trpc/react";
const { data } = api.example.hello.useQuery();

// Server-side (in server components/actions)
import { api } from "@/trpc/server";
const data = await api.example.hello();
```

### Protected Routes
- Use `protectedProcedure` in tRPC for authenticated endpoints
- Access user via `ctx.session.user` in procedures
- Middleware validates session automatically

### Database Queries
- Use Drizzle ORM syntax
- Access DB via `ctx.db` in tRPC procedures
- Schema types are auto-generated from Drizzle tables

### Form Handling
- Define Zod schemas in `/packages/validators/src/`
- Use React Hook Form with zodResolver
- Server actions can use `schema.parse()` for validation

### Cross-Package Imports
- Use workspace protocol: `"@charmlabs/package": "workspace:*"`
- All packages follow `@charmlabs/*` namespace (replaceable)
- TypeScript paths configured for clean imports

## Testing Strategy

The project is configured for comprehensive testing (setup in progress):
- **Unit Tests**: Vitest for fast unit testing
- **Component Tests**: Testing Library for React components
- **E2E Tests**: Playwright for end-to-end testing
- **API Mocking**: MSW (Mock Service Worker)
- **Database Tests**: Testcontainers for integration tests

## Plugin Architecture

The `/packages/core` implements a plugin-based architecture for extensibility:
- Plugins can extend database schema
- Hook into application lifecycle
- Add new API endpoints
- Extend the admin interface

## File Structure

```
/apps/web/src
  /app              # Next.js app router pages
  /components       # Web app components
  /hooks           # Custom React hooks
  /lib             # Utilities and configurations
  /server          # Server-side code
  /styles          # Global styles
  /trpc            # tRPC client setup
```