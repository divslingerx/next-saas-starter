# Documentation

## Architecture Documentation

### Core Documents

1. **[PLATFORM-ARCHITECTURE.md](./PLATFORM-ARCHITECTURE.md)**
   - Overall system architecture
   - Package structure and boundaries
   - Core concepts (flexible objects, unified identity, property history)
   - Multi-app configuration approach
   - Technology stack and scaling considerations

2. **[MULTI-APP-ARCHITECTURE.md](./MULTI-APP-ARCHITECTURE.md)**
   - How to configure different apps from same codebase
   - Example configurations (ecommerce, music admin panel)
   - Email templates per app
   - Deployment strategies

3. **[ARCHITECTURE-REVIEW-PROMPT.md](./ARCHITECTURE-REVIEW-PROMPT.md)**
   - Comprehensive prompt for AI architecture review
   - Performance analysis questions
   - Security considerations
   - Scalability assessment criteria

4. **[TESTING-STRATEGY.md](./TESTING-STRATEGY.md)**
   - Testing approach across the monorepo
   - Unit, integration, and E2E testing
   - Test infrastructure setup

## Project Planning

The `/stories` directory contains detailed project epics and user stories for implementing various features. These are primarily for project management and can be referenced when implementing new features.

## Quick Links

### For Developers
- Start with [PLATFORM-ARCHITECTURE.md](./PLATFORM-ARCHITECTURE.md) to understand the system
- Review package structure in the main README
- Check `/packages/*/README.md` for package-specific documentation

### For Architecture Review
- Use [ARCHITECTURE-REVIEW-PROMPT.md](./ARCHITECTURE-REVIEW-PROMPT.md) with any AI assistant
- Focus on database design and performance sections
- Review scaling considerations

### For New Features
- Check if similar features exist in `/stories` directory
- Follow domain boundaries (CRM, Ecom, Marketing are separate)
- Use the flexible object system for custom entities

## Key Concepts to Understand

1. **Flexible Object System** - How we handle dynamic schemas
2. **Property History** - Audit trail and workflow triggers
3. **Unified Identity** - Single person table across all domains
4. **Domain Separation** - CRM, Ecom, Marketing as separate packages
5. **Multi-tenancy** - Organization-based data isolation