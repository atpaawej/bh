# BharatHunt — Decision Log

> Every decision from the architectural grilling session on 2026-07-22.

---

## 🎯 Product Scope

**BH is a Product Hunt clone** — a weekly product discovery platform for the Indian maker community. Community-driven discovery ranked weekly, no editorial review. Products are launched by makers, voted and commented on by the community.

- **Weekly ranking cycle**: Friday → Thursday
- **Launch models**: Instant publish (goes live immediately) OR Schedule for next Friday
- **No curation/review**: No moderation team. Products go live instantly or on scheduled date.
- **Voting**: Upvote only, one vote per user per product. No downvoting.
- **Categories**: 10 fixed categories (DevTools, AI/ML, SaaS, Design, Productivity, Mobile Apps, Marketing, Fintech, Education, Entertainment)
- **Comments**: Plain text, sanitized (no HTML), support one level of nesting

---

## 🏗 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js 16 + React 19 + Tailwind CSS | SSR for SEO, App Router, fast iteration |
| **Backend** | Express + TypeScript + REST API (separate from frontend) | Full control over auth/security |
| **Database** | Supabase (PostgreSQL) | Same provider as auth, managed Postgres |
| **ORM** | Prisma | Type-safe schema, clear migrations, parameterized queries = no SQL injection |
| **Auth** | Supabase Auth (Magic link + Google + GitHub) | Handles OAuth, magic links out of the box |
| **Media** | Cloudinary | Image optimization, CDN, resizing on the fly |
| **Monorepo** | Turborepo | Shared types between frontend/backend via `packages/shared` |
| **Deploy — Frontend** | Vercel | Auto-deploys from GitHub, optimized for Next.js |
| **Deploy — Backend** | Google Cloud Run | Deployed via Docker, manual deploys (no CI/CD for now) |

---

## 🧱 Backend Architecture

```
packages/backend/
├── src/
│   ├── routes/          # Express routes — maps URL → controller
│   ├── controllers/     # Parses request, calls service, sends response
│   ├── services/        # ALL business logic lives here
│   ├── middleware/       # Auth, validation, rate-limit, error handler
│   ├── validators/      # Zod schemas for request validation
│   ├── config/          # Env vars validated with Zod at startup
│   ├── db/              # Prisma client singleton
│   └── shared/          # Utils (slugify, etc.)
├── prisma/
│   └── schema.prisma
└── index.ts
```

**Layer rules (strict):**
- `routes → controllers → services → db` (top to bottom only)
- Controllers NEVER import `db/` directly
- Services NEVER import `express` or touch `req`/`res`
- Business logic ONLY exists in `services/`
- No layer leaps — a controller cannot bypass services to call db directly

### Data Model

**User** — id, email, name, avatarUrl, bio, twitterHandle, website, timestamps
**Product** — id, name (unique slug auto-generated), tagline, description, websiteUrl, demoUrl, logoUrl, heroImageUrl, galleryUrls[], videoUrl, status (draft/submitted/featured), launchedAt, scheduledFor, makerId (FK), categoryId (FK), timestamps
**Category** — id, name (unique), slug (unique), description
**Vote** — id, userId (FK), productId (FK), createdAt — unique(userId, productId)
**Comment** — id, body (sanitized), userId (FK), productId (FK), parentId (FK for nested replies), createdAt
**RefreshToken** — id, token (unique), userId (FK), expiresAt, createdAt

---

## 🔒 Security Architecture

| Principle | Implementation |
|---|---|
| **Auth handled by backend only** | Frontend never touches Supabase Auth directly. Credentials go to Express → backend authenticates via Supabase → returns JWT |
| **JWT in memory, refresh in HTTP-only cookie** | Access token stored in JS memory (lost on refresh, recovered via cookie). Refresh cookie: `httpOnly`, `secure`, `sameSite: strict` |
| **Refresh token rotation** | Old refresh token is invalidated when a new one is issued. Stolen tokens become useless |
| **Every request validated** | Zod schemas on every mutating endpoint — type, length, format enforced before reaching service layer |
| **Ownership checks on every mutation** | Services verify `resource.makerId === currentUserId` before allowing update/delete |
| **Rate limiting** | API: 100 req/15min. Voting: 10/min. Auth: 5 login attempts/15min |
| **CORS** | Whitelist only the frontend origin |
| **Security headers** | Helmet.js (CSP, HSTS, X-Frame-Options, etc.) |
| **No secrets in code** | All env vars validated at startup via Zod. App crashes if any are missing |
| **HTML sanitization** | Comments run through `sanitize-html` — no HTML tags allowed |
| **Parameterized queries** | Prisma — no SQL injection surface |
| **Error handling** | Single `errorHandler` middleware. Prisma errors mapped to clean messages. Stack traces never leak to client |

---

## 🔄 User Flows

### Public pages (no auth)
- `/` — Weekly feed/leaderboard (Friday→Thursday)
- `/products/[slug]` — Product detail (read-only, vote button prompts login)
- `/category/[slug]` — Filtered feed by category
- `/users/[username]` — User profile with their products
- `/leaderboard?week=...` — Past weeks archive
- `/auth/login` — Login page (Magic link + Google + GitHub)
- `/auth/callback` — OAuth callback handler

### Authenticated pages (login required)
- `/launch` — Create product form
- `/products/[slug]/edit` — Edit own product
- `/settings` — Edit profile (name, bio, avatar, social)
- `/dashboard` — My products, stats, activity

### Auth gates
- **Browse** → No auth
- **Upvote / Comment** → Auth required (redirect to login with return URL)
- **Create product** → Auth required (redirect to login with return URL)
- **Edit / Delete** → Must be product owner (403 if not)

### Weekly cycle
- **Friday 00:00 UTC**: New week starts. Previous week's leaderboard freezes (accessible at `/leaderboard?week=...`). All scheduled products auto-publish via Cloud Scheduler.
- **During week**: Products ranked by pure vote count. Each user gets 1 vote per product.
- **Thursday 23:59:59 UTC**: Week closes.

---

## 🎨 Design System

**Source of truth**: `.prototype/cohere/` — HTML/CSS prototype, no Figma intermediate.

**Vibe**: White editorial canvas · deep green product bands · near-black pill CTAs · coral taxonomy chips · soft stone cards · monumental type

**Tokens** (from `.prototype/cohere/DESIGN.md`):
- Canvas: `#ffffff`
- Primary: `#17171c`
- Deep green: `#003c33`
- Soft stone: `#eeece7`
- Coral: `#ff7759`
- Ink: `#212121`
- Muted: `#93939f`
- Action blue: `#1863dc`

**Typography**: Space Grotesk (display), Inter (body), JetBrains Mono (labels)

**Radius**: 4/8/16/22/30/32 (pill)

**Frontend issue**: https://github.com/atpaawej/bh/issues/1

---

## 🚀 Deployment

| Service | Platform | Method |
|---|---|---|
| Frontend (Next.js) | Vercel | Auto-deploy from GitHub (connected) |
| Backend (Express) | Google Cloud Run | Manual deploy via Docker + `gcloud run deploy` |
| Scheduled tasks | Cloud Scheduler | Hits `/api/cron/publish-week` with `X-Cron-Secret` header every Friday 00:00 UTC |
| CI/CD | None for v1 | All deploys manual |

---

## 📦 Monorepo Structure

```
BH/
├── packages/
│   ├── frontend/          # Next.js 16 + React 19 + Tailwind CSS
│   ├── backend/           # Express + TypeScript API
│   └── shared/            # Contracts (types, constants, categories)
├── .prototype/            # Design prototype (Cohere system)
├── docs/                  # Documentation
├── package.json           # Turborepo root
├── turbo.json             # Build pipeline
├── ARCHITECTURE.md        # Architecture reference
├── CONTRIBUTING.md        # Contribution guide
└── README.md              # Project overview
```

---

## Key Principles

1. **Vote with the product, not the person** — one vote per user per product, pure upvote system
2. **Fair weekly window** — every product gets the same Friday→Thursday cycle
3. **Security over convenience** — backend handles all auth, JWTs in memory, refresh rotation
4. **No over-engineering** — route→service→db is enough. Extract layers when needed, not before
5. **Prototype before committing** — frontend design was decided by iterating on a visual prototype, not by spec

---

## Future Considerations (v2+)

- Social sharing buttons
- Notifications (email/push)
- Product maker following
- Collections / bookmarks
- Badges / gamification
- Admin dashboard
- Public API for third parties
- Product updates / changelog
- Jobs board
- Recency-weighted ranking algorithm
