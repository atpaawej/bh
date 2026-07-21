# Architecture

## Overview

BharatHunt follows a **monorepo** structure with three packages:

```
bh/
├── packages/
│   ├── frontend/     # Next.js application (Vercel)
│   ├── backend/      # Express TypeScript API
│   └── shared/       # Shared contracts (types, constants)
├── package.json      # Turborepo root
└── turbo.json        # Build pipeline
```

## Data Flow

```
Browser → Next.js (frontend) → Express API (backend) → Supabase (PostgreSQL)
                                                ↕
                                          Cloudinary (images)
```

## Backend Layered Architecture

```
routes/  →  controllers/  →  services/  →  db/
  │                                          (Prisma)
middleware/
  (auth, validation, rate-limit, error handler)
```

### Layer Rules

| Layer | Responsibility | Imports From |
|---|---|---|
| `routes/` | Map HTTP methods + paths to controllers | controllers, middleware |
| `controllers/` | Parse request, call service, send response | services, shared types |
| `services/` | ALL business logic, ownership checks, validation | db, shared types, errors |
| `middleware/` | Auth, validation, rate limiting, error handling | services (auth), shared types |
| `db/` | Prisma client singleton | — |

### NEVER

- A controller imports `db/` directly
- A service imports `express` or touches `req`/`res`
- Business logic exists anywhere outside `services/`
- A `controllers/` or `services/` file exceeds ~200 lines

## Security Architecture

- **Auth handled by backend only** — frontend never touches Supabase Auth directly
- JWTs stored in memory (never localStorage), refresh tokens in HTTP-only cookies
- Refresh token rotation — old tokens invalidated on each refresh
- Every protected route goes through `authMiddleware`
- Every mutating service function checks resource ownership
- Input validated by Zod schemas before reaching services
- Rate limiting on auth (5/min) and voting (10/min)
- Helmet security headers, strict CORS, HTML sanitization on comments

## Weekly Rankings

- Cycle: **Friday → Thursday**
- Every product launched in the current week competes in that week's leaderboard
- Rankings reset every Friday at 00:00 UTC
- Homepage shows current week's products, sorted by vote count
