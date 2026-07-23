<div align="center">
  <br/>
  <pre>
██████╗ ██╗  ██╗ █████╗ ██████╗  █████╗ ████████╗██╗  ██╗██╗   ██╗███╗   ██╗████████╗
██╔══██╗██║  ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██║  ██║██║   ██║████╗  ██║╚══██╔══╝
██████╔╝███████║███████║██████╔╝███████║   ██║   ███████║██║   ██║██╔██╗ ██║   ██║   
██╔══██╗██╔══██║██╔══██║██╔══██╗██╔══██║   ██║   ██╔══██║██║   ██║██║╚██╗██║   ██║   
██████╔╝██║  ██║██║  ██║██║  ██║██║  ██║   ██║   ██║  ██║╚██████╔╝██║ ╚████║   ██║   
╚══════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   
  </pre>
  <h3>🇮🇳 Indian tech deserves a launchpad.</h3>
  <p>
    <strong>BharatHunt</strong> — a weekly product discovery platform for the Indian maker community.
    Ship your product. Get discovered. Get feedback. Grow.
  </p>
  <br/>
  <p>
    <a href="#-vision">Vision</a> •
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-project-structure">Project Structure</a> •
    <a href="#-api-overview">API Overview</a> •
    <a href="#-contributing">Contributing</a>
  </p>
  <br/>
</div>

---

## 🌟 Vision

Every week, incredible products are built by Indian makers — but they don't get the launchpad they deserve. **BharatHunt** changes that.

A place where:
- **Makers** ship their products and get real feedback from a community that cares
- **Early adopters** discover the next big thing before everyone else
- **The Indian tech ecosystem** gets the spotlight it has always deserved

No gatekeepers. No editorial review. Just pure, community-driven discovery — ranked weekly, reset every Friday.

> 🇮🇳 *Bharat me bana, duniya ke liye.*

---

## 🎯 Features

### 👤 For Makers
- **Launch instantly**, **save as draft**, or **schedule** for the next weekly cycle
  - Draft mode: save your work privately, come back to edit later
  - Schedule: auto-publish on Friday when the community is most active
- Beautiful product pages with logo, hero image, gallery, and video embeds
- Real-time community feedback via upvotes and threaded comments
- Maker profiles showcasing everything you've built

### 🗳️ For the Community
- **Weekly ranked feed** (Friday → Thursday) — every product gets a fair shot
- One upvote per product per user — your vote matters
- Category filters: Developer Tools, AI/ML, SaaS, Design, Productivity, and more
- Nested comments for genuine conversations

### 🔒 Built Right
- **All auth handled server-side** — JWTs in memory, refresh tokens in HTTP-only cookies with rotation
- **OAuth (Google/GitHub)** and **magic link** authentication via Supabase Auth
- **PKCE flow** — no client secrets needed, immune to authorization code interception
- **Rate limited, validated, sanitized** — Zod validation at every boundary, input sanitization
- **Ownership enforced everywhere** — you own your content, period

---

## 🛠 Tech Stack

```
Frontend          Backend             Database           Infrastructure
┌──────────┐     ┌──────────┐       ┌──────────┐       ┌────────────┐
│ Next.js  │     │ Express  │       │PostgreSQL│       │  Supabase  │
│ React 19 │ ──▶ │  (TS)    │ ────▶ │ Prisma   │ ────▶ │  Auth + DB │
│ Tailwind │     │   Zod    │       │          │       │ Cloudinary │
│  (TS)    │     │  JWT     │       │          │       │  (images)  │
└──────────┘     └──────────┘       └──────────┘       └────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS | Server-rendered app with client-side interactivity |
| **Backend** | Express 4, TypeScript | REST API with layered architecture |
| **Validation** | Zod 3 | Schema validation at every boundary |
| **Database** | PostgreSQL + Prisma ORM | Relational data model with type-safe queries |
| **Auth** | Supabase Auth + JWT + Refresh Tokens | OAuth (Google/GitHub), magic links, PKCE |
| **Media** | Cloudinary | Signed uploads for product images (logos, heroes, galleries) |
| **Monorepo** | npm workspaces + Turborepo | Shared types across packages |

---

## 🏗 Architecture

### Package Layout

```
packages/
  shared/      ← Shared types & constants (used by both frontend & backend)
  backend/     ← Express API server
  frontend/    ← Next.js application
```

### Deep Module Convention

Every package follows the **deep module** pattern: a lot of behaviour behind a small interface.

```
packages/<name>/
  index.ts      ← Entry point (public). Import this from outside.
  lib/          ← Implementation: hidden from outside, free to import each other.
  tests/        ← Co-located tests + fixtures (a subfolder, so private).
```

**Import rules:**
1. Code outside a package may import only that package's entry points (root files)
2. A package's own files import each other freely
3. Tests through the entry points — never into `lib/` of another package
4. No dependency cycles between packages

### Backend Layers

```
routes/         ← HTTP route definitions (thin — delegates to services)
  ├── productRoutes.ts
  ├── authRoutes.ts
  └── categoryRoutes.ts

middleware/     ← Express middleware (auth, validation, rate limiting, error handling)
  ├── auth.ts                    JWT verification (required & optional)
  ├── validate.ts                Zod schema validation
  ├── errorHandler.ts            Centralized error handling
  ├── rateLimiter.ts             Rate limiting per endpoint
  └── asyncHandler.ts            Async error wrapper

services/       ← Business logic (no HTTP awareness)
  ├── productService.ts          CRUD, voting, listing
  ├── authService.ts             OAuth, magic link, JWT + refresh tokens
  ├── cloudinaryService.ts       Signed upload URL generation
  └── categoryService.ts         Category listing

validators/     ← Zod schemas (contracts at the boundary)
  ├── productSchema.ts           CreateProductInput, UpdateProductInput
  └── authSchema.ts              Login request validation
```

### Data Model

```
User ──1:N── Product     Maker of products
User ──1:N── Vote        Upvote products (unique per user+product)
User ──1:N── Comment     Threaded comments on products
User ──1:N── RefreshToken  Session management with rotation

Product ──N:1── Category  Each product belongs to one category
Product ──1:N── Vote      Community ranking
Product ──1:N── Comment   Community feedback

Comment ──self── Comment  Nested replies (parentId)
```

Product statuses: `draft` (unlisted), `submitted` (live), `featured` (highlighted)

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- A Supabase project (for auth + database)
- A Cloudinary account (for image uploads)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/atpaawej/bh.git
cd bh

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp packages/backend/.env.example packages/backend/.env
```

Required environment variables in `packages/backend/.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (admin operations) |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | Access token TTL (default: 15m) |
| `REFRESH_TOKEN_SECRET` | Secret for hashing refresh tokens (min 32 chars) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Frontend origin (for CORS) |

```bash
# 4. Set up the database
npx prisma db push        # Create tables from schema
npx prisma db seed         # Seed categories

# 5. (Optional) Set frontend env
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api" > packages/frontend/.env.local

# 6. Start development servers
npm run dev
# Runs backend on http://localhost:4000 and frontend on http://localhost:3000
```

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start both backend + frontend in dev mode |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages + check import boundaries |
| `npm run test` | Run all tests |
| `npm run format` | Format code with Prettier |
| `npm run clean` | Clean all build artifacts |

---

## 📁 Project Structure

```
.
├── packages/
│   ├── backend/                  # Express API
│   │   ├── index.ts              # App setup + server start
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Database schema
│   │   │   └── seed.ts           # Category seeder
│   │   └── lib/
│   │       ├── config/           # Environment config (Zod-validated)
│   │       ├── db/               # Prisma client singleton
│   │       ├── middleware/       # Express middleware
│   │       ├── routes/           # HTTP route handlers
│   │       ├── services/         # Business logic layer
│   │       ├── shared/           # Server-side utilities (slugify, week math)
│   │       ├── supabase/         # Supabase client setup
│   │       └── validators/       # Zod request schemas
│   │
│   ├── frontend/                 # Next.js 16 application
│   │   ├── app/                  # App router pages
│   │   │   ├── page.tsx          # Home — weekly feed + marketing
│   │   │   ├── layout.tsx        # Root layout (fonts, nav, auth)
│   │   │   ├── launch/           # Product launch form
│   │   │   ├── products/         # Product detail + edit pages
│   │   │   └── auth/             # Login + OAuth callback
│   │   ├── components/           # Shared React components
│   │   └── lib/
│   │       ├── api.ts            # API client (auto-refresh, error handling)
│   │       └── auth/             # Auth context + token store
│   │
│   └── shared/                   # Shared types & constants
│       ├── index.ts              # Public exports
│       └── lib/
│           ├── types.ts          # API contracts (CreateProductInput, ProductResponse, etc.)
│           └── constants.ts      # Categories list
│
├── CLAUDE.md                     # AI coding standards
├── CODING_STANDARDS.md           # Architecture & naming rules
└── package.json                  # Monorepo root (npm workspaces + turbo)
```

---

## 📡 API Overview

Base URL: `http://localhost:4000/api`

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Start OAuth, send magic link, or complete authentication |
| `POST` | `/auth/refresh` | Rotate refresh token → new access token |
| `POST` | `/auth/logout` | Invalidate refresh token |

### Products

| Method | Path | Description |
|---|---|---|
| `GET` | `/products` | List products (weekly feed, paginated) |
| `GET` | `/products/:slug` | Get product detail |
| `GET` | `/products/:slug/edit` | Get product for editing (includes drafts) |
| `POST` | `/products` | Create a product (publish / save draft / schedule) |
| `PATCH` | `/products/:slug` | Update a product |
| `DELETE` | `/products/:slug` | Delete a product |
| `POST` | `/products/:slug/vote` | Upvote a product |
| `DELETE` | `/products/:slug/vote` | Remove upvote |
| `GET` | `/products/upload-url` | Get signed Cloudinary upload URL |

### Categories

| Method | Path | Description |
|---|---|---|
| `GET` | `/categories` | List all categories |

### Leaderboard

| Method | Path | Description |
|---|---|---|
| `GET` | `/leaderboard` | Current week's products ranked by votes (public) |
| `GET` | `/leaderboard?week=2026-W30` | Specific week's ranked products (public) |

### Cron / Scheduled Tasks

| Method | Path | Description |
|---|---|---|
| `POST` | `/cron/publish-week` | Publish all draft products scheduled for the current week (gated by `X-Cron-Secret`) |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |

---

## 🚀 Deployment

See [docs/deploy.md](./docs/deploy.md) for:
- Building and deploying the backend to Cloud Run
- Cloud Scheduler cron job setup (weekly product publishing)

---

## 👨‍💻 Contributing

1. **Branch from `main`** — use a descriptive name
2. **Follow the coding standards** — see [CODING_STANDARDS.md](./CODING_STANDARDS.md)
3. **Deep module discipline** — see [packages/README.md](./packages/README.md)
4. **Characterize before modifying** — run existing tests first
5. **Small blast radius** — one feature touches 2–3 files in one package
6. **Open a pull request** — describe what changed and why

---

<div align="center">
  <br/>
  <p>Built with ❤️ for the Indian maker community</p>
  <p>
    <a href="https://github.com/atpaawej/bh">GitHub</a>
  </p>
  <br/>
</div>
