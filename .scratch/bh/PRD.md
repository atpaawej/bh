# BharatHunt v1 — Product Requirements Document

## Problem Statement

Indian makers build incredible products every week, but there is no dedicated, community-driven platform to discover, showcase, and get feedback on them. Existing platforms are either global (Product Hunt — crowded, English-first, not India-focused), siloed (Twitter, LinkedIn — no structured discovery), or require editorial approval (waiting for a curator to say yes). Makers need a launchpad that is instant, fair, and built for the Indian tech ecosystem.

## Solution

BharatHunt (BH) — a Product Hunt clone purpose-built for the Indian maker community. A web platform where:

- Makers launch their products instantly or schedule for a weekly cycle (Friday→Thursday)
- The community discovers, upvotes, and comments on products
- Products are ranked by pure vote count within each weekly cycle, resetting every Friday
- No editorial review, no gatekeepers — just community-driven discovery
- Weekly ranking cycle: Friday → Thursday. Products launched within a week compete in that week's leaderboard. A new leaderboard begins every Friday 00:00 UTC.

---

## User Stories

### Authentication & Onboarding

1. As a visitor, I want to browse the weekly feed and product pages without signing up, so that I can discover products before committing to an account.
2. As a new user, I want to sign up using my Google account, so that I don't need to remember another password.
3. As a new user, I want to sign up using my GitHub account, so that I can use my existing developer identity.
4. As a new user, I want to sign up using a magic link sent to my email, so that I have a passwordless option.
5. As a returning user, I want to log in with one click via Google/GitHub, so that I can access my account quickly.
6. As a returning user, I want to receive a magic link in my email, so that I can log in even if OAuth is unavailable.
7. As an authenticated user, I want my session to persist across page refreshes, so that I don't have to log in repeatedly.
8. As an authenticated user, I want to log out, so that I can switch accounts or end my session securely.

### Product Discovery (Public)

9. As a visitor, I want to see the current week's products ranked by vote count on the homepage, so that I can quickly see what's popular.
10. As a visitor, I want to infinite-scroll through the weekly feed, so that I can browse without clicking through pages.
11. As a visitor, I want to filter products by category, so that I can discover products relevant to my interests (e.g., AI/ML, Developer Tools, Fintech).
12. As a visitor, I want to click on a product to see its full detail page, so that I can read its description, see images, and visit its website.
13. As a visitor, I want to see past weeks' leaderboards, so that I can discover products I missed.
14. As a visitor, I want to view a maker's profile with all their launched products, so that I can follow their work.

### Product Launches (Authenticated)

15. As a maker, I want to create a product listing with name, tagline, description, category, links, and images, so that I can present my product compellingly.
16. As a maker, I want to upload a logo and a hero image for my product, so that my listing looks professional.
17. As a maker, I want to add optional gallery screenshots and a demo video URL, so that visitors can see my product in action.
18. As a maker, I want to launch my product instantly, so that it appears on the current week's feed immediately.
19. As a maker, I want to schedule my product for next Friday's cycle, so that I can build anticipation and time my launch.
20. As a maker, I want to save my product as a draft, so that I can finish filling in details later.
21. As a maker, I want to edit my product listing after launching, so that I can fix typos or update information.
22. As a maker, I want to delete my product listing, so that I can remove it if I no longer want it public.
23. As a maker, I want to share my product's URL after launch, so that I can promote it on social media.

### Voting

24. As a logged-in user, I want to upvote a product, so that I can show my support and help it rank higher.
25. As a logged-in user, I want to remove my upvote, so that I can change my mind.
26. As a logged-in user, I want to see the total vote count on each product, so that I can gauge community interest.
27. As a logged-in user, I want to see which products I have already voted on, so that I don't try to vote twice.
28. As a user, I want to be limited to one vote per product, so that the ranking stays fair.

### Comments

29. As a logged-in user, I want to comment on a product, so that I can ask questions or give feedback.
30. As a logged-in user, I want to reply to an existing comment, so that I can have threaded conversations.
31. As a logged-in user, I want to delete my own comment, so that I can remove something I regret posting.
32. As a visitor, I want to read comments on a product page, so that I can see community feedback before trying the product.
33. As a user, I want comments to be plain text (no HTML), so that I know the platform is safe from XSS.

### User Profile & Settings

34. As a logged-in user, I want a profile page that shows my name, bio, avatar, social links, and all my launched products, so that I have a public maker identity.
35. As a logged-in user, I want to edit my profile (name, bio, avatar, social links), so that I can keep my information up to date.
36. As a logged-in user, I want a dashboard showing my products and their vote counts, so that I can track engagement.

### Design & UX

37. As any user, I want the platform to look polished and feel fast, so that I enjoy using it.
38. As any user, I want the platform to work on mobile (responsive design), so that I can browse on my phone.
39. As any user, I want product pages to have proper SEO meta tags, so that they rank in Google search.
40. As any user, I want to see a friendly message when a category or week has no products yet, so that I know the platform is still growing.
41. As any user, I want to see a clear error page (404/500) with a retry option, so that I never hit a dead end.
42. As any user, I want to see loading states (skeletons/spinners) while data is fetching, so that I know the app is working.

---

## Implementation Decisions

### Architecture

- Monorepo with Turborepo: `packages/frontend` (Next.js), `packages/backend` (Express), `packages/shared` (contracts)
- Backend follows strict layer isolation: routes → controllers → services → db
- No layer may import from another layer that is not its immediate neighbor in the chain
- Services contain ALL business logic and are pure TypeScript — zero HTTP knowledge
- Shared contracts package (`packages/shared`) defines API request/response types, error codes, and constants consumed by both frontend and backend

### Backend (Express + TypeScript)

| Layer | Responsibility |
|---|---|
| `routes/` | Map HTTP verbs + paths to controllers with middleware chains |
| `controllers/` | Parse request params/body, call service, send HTTP response |
| `services/` | ALL business logic (validation, ownership checks, slug generation, vote dedup) |
| `middleware/` | Auth (JWT verification), validation (Zod), rate limiting, error handler, async handler wrapper |
| `validators/` | Zod schemas — one per resource (product schema, comment schema, etc.) |
| `config/` | Environment variable validation with Zod at startup (crash if missing) |
| `db/` | Prisma client singleton |
| `shared/` | Utility functions (slugify, etc.) |

### Auth & Security

- Auth is handled entirely by the backend — frontend never touches Supabase Auth directly
- Flow: Frontend sends credentials → backend authenticates via Supabase → backend returns signed JWT + HTTP-only refresh cookie
- JWT stored in memory (JavaScript variable, never localStorage)
- Refresh token stored as HTTP-only, Secure, SameSite=Strict cookie
- Refresh token rotation: old token invalidated when new one is issued
- Every protected route is gated by authMiddleware (JWT verification)
- Every mutating service function checks resource ownership
- Rate limiting: API (100/15min), Voting (10/min), Auth (5/15min)
- CORS restricted to frontend origin only
- Helmet.js for security headers
- Input validated by Zod schemas before reaching services
- Comments sanitized with sanitize-html (no HTML tags allowed)
- All database access via Prisma (parameterized queries, no SQL injection)
- Single errorHandler middleware catches and maps all errors (AppError, Prisma, Zod, unknown)

### Data Model (Prisma)

**User**: id, email (unique), name, avatarUrl?, bio?, twitterHandle?, website?, createdAt, updatedAt

**Product**: id, name, slug (unique), tagline, description, websiteUrl, demoUrl?, logoUrl, heroImageUrl, galleryUrls[], videoUrl?, status (draft/submitted/featured), launchedAt?, scheduledFor?, makerId (FK→User), categoryId (FK→Category), createdAt, updatedAt

**Category**: id, name (unique), slug (unique), description

**Vote**: id, userId (FK→User), productId (FK→Product), createdAt — unique constraint on (userId, productId)

**Comment**: id, body, userId (FK→User), productId (FK→Product), parentId? (FK→Comment), createdAt

**RefreshToken**: id, token (unique), userId (FK→User), expiresAt, createdAt

### API Routes

**Products**
- `GET /api/products` — list products (paginated, filterable by category/week)
- `GET /api/products/:slug` — single product with details
- `POST /api/products` — create product (auth)
- `PATCH /api/products/:slug` — update product (owner only)
- `DELETE /api/products/:slug` — delete product (owner only)

**Votes**
- `POST /api/products/:slug/vote` — upvote (auth, rate limited)
- `DELETE /api/products/:slug/vote` — remove upvote (auth)

**Comments**
- `GET /api/products/:slug/comments` — list comments for product
- `POST /api/products/:slug/comments` — add comment (auth)
- `DELETE /api/products/:slug/comments/:id` — delete comment (owner only)

**Categories**
- `GET /api/categories` — list all categories

**Users**
- `GET /api/users/:username` — user profile with their products
- `PATCH /api/users/me` — update own profile (auth)

**Leaderboard**
- `GET /api/leaderboard` — current week's leaderboard
- `GET /api/leaderboard?week=2026-W30` — specific week's leaderboard

**Auth**
- `POST /api/auth/login` — handle OAuth callback or magic link verification
- `POST /api/auth/refresh` — refresh access token using HTTP-only cookie
- `POST /api/auth/logout` — clear refresh cookie + invalidate token

**Cron (internal, header-gated)**
- `POST /api/cron/publish-week` — triggered by Cloud Scheduler every Friday 00:00 UTC, publishes all scheduled products

### Frontend (Next.js 16 + React 19 + Tailwind CSS)

**Design System**: Cohere-inspired (prototype lives at `.prototype/cohere/`)

| Token | Value | Role |
|---|---|---|
| Canvas | `#ffffff` | Default page background |
| Primary | `#17171c` | Near-black pill CTAs, dark footer |
| Deep green | `#003c33` | Capability / product bands |
| Soft stone | `#eeece7` | Product cards, stone sections |
| Coral | `#ff7759` | Filter chips, warm accents only |
| Ink | `#212121` | Body text |
| Muted | `#93939f` | Metadata, footer links |
| Action blue | `#1863dc` | Editorial links |

**Typography**: Space Grotesk (display), Inter (body), JetBrains Mono (labels)
**Radius**: 4 / 8 / 16 / 22 / 30 / 32 (pill)

**Pages:**

| Route | Purpose | Auth |
|---|---|---|
| `/` | Weekly feed (ranked by votes, paginated) | Public |
| `/products/[slug]` | Product detail (read-only, vote/comment requires auth) | Public |
| `/products/[slug]/edit` | Edit product | Owner only |
| `/launch` | Create product (instant or schedule) | Required |
| `/category/[slug]` | Category-filtered feed | Public |
| `/leaderboard?week=...` | Past weeks archive | Public |
| `/users/[username]` | User profile + their products | Public |
| `/settings` | Edit profile | Required |
| `/dashboard` | My products and stats | Required |
| `/auth/login` | Login (Magic link + Google + GitHub) | Public |
| `/auth/callback` | OAuth callback handler | Public |

**Every page covers:** loading (skeleton/spinner), empty (friendly message), error (message + retry), success (content), edge cases.

### Media

- Cloudinary for all image uploads (logo, hero, gallery)
- Backend generates signed upload URLs — frontend uploads directly to Cloudinary, file never touches the Express server
- Images optimized via Cloudinary transformations

### Deployment

- Frontend: Vercel (auto-deploy from GitHub)
- Backend: Google Cloud Run (manual deploy via Docker + `gcloud run deploy`)
- Cloud Scheduler: Hits `POST /api/cron/publish-week` every Friday 00:00 UTC with `X-Cron-Secret` header
- No CI/CD pipeline for v1 — all deploys manual

---

## Testing Decisions

### Testing philosophy
- Test external behavior, not implementation details
- The seam for testing is the **service layer** — services contain all business logic and are pure TypeScript functions with no HTTP dependencies
- A single service function tested with varied inputs (valid, invalid, edge case, auth failure) covers the most surface with the fewest tests

### What to test
- **ProductService**: create (valid input, duplicate slug, missing category, scheduled vs instant, ownership check on update/delete), vote (first vote, duplicate vote, unvote, non-existent product)
- **Auth middleware**: valid JWT, expired JWT, missing header, malformed token
- **Validation schemas**: valid input passes, invalid input (wrong types, missing required fields, exceeding length limits, invalid URLs) returns descriptive errors
- **Error handler**: AppError maps to correct status/code, Prisma errors map cleanly, unknown errors return 500 without leaking stack traces

### What NOT to test (v1)
- Frontend component rendering (deferred until design system is finalized)
- Integration / E2E tests (deferred until API surface is stable)
- Database layer (Prisma is trusted — tested upstream)

---

## Out of Scope

- Social sharing buttons
- Notifications (email or push)
- Following / feed personalization
- Collections / bookmarks / saved products
- Badges, achievements, maker reputation scores
- Admin dashboard
- Public API for third-party consumption
- Product updates / changelog per product
- Jobs board
- Recency-weighted ranking algorithm
- Dark mode
- i18n / multi-language support
- PWA / offline support
- Native mobile apps

---

## Further Notes

- The design prototype (Cohere-inspired) lives at `.prototype/cohere/` and includes HTML pages for the homepage, product detail, launch form, login, category feed, leaderboard, and user profile. Tokens are documented in `.prototype/cohere/DESIGN.md` and `.prototype/handoff.md`. The prototype is the source of truth for visual decisions — reference these files directly when implementing the design system in Tailwind.
- All architectural decisions are documented in `docs/bh-decision-log.md`. Read it before starting implementation.
- Issue #1 (https://github.com/atpaawej/bh/issues/1) tracks the design system handoff process.
- Weekly cycle: Friday 00:00 UTC → Thursday 23:59:59 UTC. All times are UTC.
- Product cards in the feed use pure vote count for ranking within a week (most votes first).
- Scheduled products are published automatically via Cloud Scheduler on Friday 00:00 UTC — no manual intervention needed.
- Auth uses HTTP-only cookies for refresh tokens. CORS must be configured to allow credentials from the frontend origin.
