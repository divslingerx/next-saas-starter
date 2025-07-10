# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Framework**: Next.js 15.2.3 with App Router and React 19
- **Language**: TypeScript 5.8.2 with strict mode
- **Authentication**: Better Auth with extensive plugin ecosystem
- **Database**: PostgreSQL with Drizzle ORM
- **API Layer**: tRPC v11 for type-safe APIs
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query v5
- **Payments**: Stripe integration via Better Auth plugin
- **Email**: Resend with React Email templates
- **Package Manager**: pnpm 9.9.0

## Key Commands

### Development
```bash
pnpm dev          # Start development server
pnpm dev:secure   # Start with HTTPS
pnpm build        # Build for production
pnpm start        # Start production server
pnpm preview      # Build and start locally
```

### Database
```bash
./start-database.sh   # Start local PostgreSQL in Docker/Podman
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio
```

### Code Quality
```bash
pnpm typecheck        # TypeScript type checking
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix linting issues
pnpm format:check     # Check Prettier formatting
pnpm format:write     # Apply Prettier formatting
pnpm check            # Run both lint and typecheck
```

### Authentication
```bash
pnpm auth:generate    # Generate auth code
pnpm auth:migrate     # Run auth migrations
```

## Architecture Overview

### Authentication System
- Configured in `src/lib/auth.ts` with Better Auth
- Supports multiple OAuth providers (Google, GitHub, Discord, Twitter, Microsoft, Twitch, Facebook)
- Features: 2FA, passkeys, organizations, email verification, password reset, session management
- Custom auth pages in `/src/app/(auth)/` with server-side redirect handling

### API Structure
- tRPC routers in `/src/server/api/routers/`
- Root router configuration in `/src/server/api/root.ts`
- Context creation in `/src/server/api/trpc.ts` with auth middleware
- Public and protected procedures with session validation

### Database Schema
- Tables use prefix `agency-app_`
- Auth tables defined in `/src/server/db/auth-schema.ts` (managed by Better Auth)
- Application tables in `/src/server/db/schema.ts`
- Database client in `/src/server/db/index.ts`

### Component Architecture
- UI components in `/src/components/ui/` (shadcn/ui based)
- Feature components organized by domain (auth, dashboard, admin)
- Server Components by default, Client Components marked with "use client"
- Form components use React Hook Form with Zod schemas

### Environment Variables
- Validated in `/src/env.js` using @t3-oss/env-nextjs
- Required variables defined with Zod schemas
- `.env.example` contains all required variables template

## Development Workflow

1. Ensure PostgreSQL is running: `./start-database.sh`
2. Set up environment variables: Copy `.env.example` to `.env` and fill in values
3. Run database migrations: `pnpm db:migrate`
4. Start development: `pnpm dev`
5. Before committing: `pnpm check` (runs lint and typecheck)

## Important Patterns

### tRPC Usage
```typescript
// Client-side
import { api } from "@/trpc/react";
const { data } = api.example.hello.useQuery();

// Server-side
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
- Define Zod schemas for validation
- Use React Hook Form with zodResolver
- Server actions can use `zod.parse()` for validation

## File Structure

```
/src
  /app              # Next.js app router pages
  /components       # Reusable UI components
  /hooks           # Custom React hooks
  /lib             # Utilities and configurations
  /server          # Server-side code
    /api           # tRPC API layer
    /db            # Database client and schema
  /styles          # Global styles
  /trpc            # tRPC client setup
```