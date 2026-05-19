# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this?

Respost is a mindful social network where every post is a geolocated "virtual postcard" (photo + short message from a real place). The primary interface is a map, not a scroll feed. Built on AT Protocol (Bluesky's decentralized social protocol).

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start Next.js dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

No test runner is configured yet.

## Architecture

Layered DDD architecture with strict dependency direction: domain → application → infrastructure → presenters.

- **`domain/`** — Pure business logic, no external dependencies. Branded types (`PostcardId`, `Did`, `LabelId`), value objects with validation (`createLocation`, `validatePostcard`, `isWithinRadius`). All types use `readonly` properties.
- **`application/`** — Use cases. `actions/` contains Next.js server actions (write operations). `queries/` contains read operations. Returns discriminated unions (`{ success: true; uri } | { success: false; error }`).
- **`infrastructure/atproto/`** — AT Protocol SDK wrapper. Handles auth, blob upload, and record CRUD. Singleton agent pattern.
- **`presenters/components/`** — React UI components. `PostcardMap` (MapLibre GL, "use client") and `PostcardView` (presentational).
- **`app/`** — Next.js routes. Server components by default, call application queries directly. `/` is the map view, `/p/[rkey]` is a shareable single postcard.
- **`lexicons/`** — AT Protocol record type schemas (`tech.equanimi.respost.postcard`, `tech.equanimi.respost.label`).
- **`docs/`** — `CONCEPT_BRIEF.md` (design philosophy, behavioral bets, competitive analysis) and `MVP.md` (scope, no-gos, open questions).

## Key conventions

- **Functional programming**: Pure functions, no classes in domain/application layers, immutable data
- **DDD**: Branded types for type safety, value objects with factory functions, domain logic isolated from infrastructure
- **Path aliases**: `@/domain`, `@/application`, `@/infrastructure`, `@/presenters`
- **Error handling**: Try-catch with discriminated result types, not exceptions for control flow
- **Use `for...of`** instead of `forEach`
- **Use pnpm** (not npm or yarn)

## Tech stack

- Next.js 16 + React 19 (server components, server actions)
- Tailwind CSS 4
- MapLibre GL (open-source maps)
- AT Protocol (`@atproto/api`) for decentralized data
- Zod for validation
- TypeScript strict mode

## Environment

Requires `.env` with AT Protocol credentials (see `.env.example`):
`ATPROTO_SERVICE`, `ATPROTO_IDENTIFIER`, `ATPROTO_PASSWORD`
