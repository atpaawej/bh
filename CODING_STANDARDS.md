# Coding Standards

Opinionated rules for the BH monorepo — written for developers coding with AI agents.

## Non-Negotiable Architecture Decisions

- **OCP** — add behaviour by creating new files, never by adding branches to existing code.
- **Fail Fast** — validate at every boundary (route input, service params, DB writes). Never swallow errors.
- **Explicit Contracts** — every public API declares inputs/outputs via Zod schemas or TS types.
- **CQS** — commands return `void`; queries return data; never both.
- **Small Blast Radius** — one feature change touches at most 2–3 files in one package.
- **Layered Architecture** — services don't import Prisma directly. Infrastructure lives at the edges.
- **Deep Modules** — simple interface, rich implementation. Not 15 one-liners per file.
- **DIP** — depend on abstractions. Swapping an adapter = writing one new file.
- **Composition over Inheritance** — no deep component hierarchies in React or service classes.
- **DRY (Rule of Three)** — third occurrence triggers extraction.
- **YAGNI** — no speculative abstractions for providers or patterns you don't have yet.
- **Test Behaviour, Not Implementation** — tests survive refactoring.
- **Test at the Right Level** — unit for logic, integration for boundaries, e2e for critical paths.
- **Context Locality** — related code lives close together. A route, its schema, and its helpers belong in the same area.
- **Characterization Tests** — run existing tests before modifying a module to prove existing behaviour is preserved.

## Naming Conventions

| Category | Convention | Examples |
|---|---|---|
| Files | kebab-case | `product-routes.ts`, `category-chips.tsx` |
| Variables | camelCase | `const productFeed = ...` |
| Functions | camelCase | `function getRankedFeed()` |
| Classes / Types / Interfaces | PascalCase | `class ProductService`, `type ProductFeed` |
| Constants | UPPER_SNAKE_CASE | `const MAX_RETRIES = 3` |
| Test files | `*.test.ts` next to the file | `productService.test.ts` |

✅ GOOD: `product-routes.ts`, `getRankedFeed()`, `MAX_RETRIES`
❌ BAD: `product_routes.ts`, `get_ranked_feed()`, `maxRetries` for a module-level constant

## Code Style & Formatting

- **Formatter**: Prettier with default settings (80 col).
- **Type-checker**: `tsc --noEmit` — run before committing.
- **Format before commit**: `npm run format`.

✅ GOOD: `npm run format && npm run lint` before pushing
❌ BAD: committing unformatted code and relying on CI to catch it

## Module Boundaries

- **One public API per package** — `index.ts` at the package root IS the public face. No deep imports like `@bh/backend/lib/services/...`.
- **No circular dependencies** — enforced by dependency-cruiser.
- **Package dependency direction**: `frontend → shared ← backend`. Shared never imports frontend or backend.
- **Services define the interface; adapters implement it** — Prisma is an adapter, not a service concern.

✅ GOOD: `import { ProductFeed } from '@bh/shared'`
❌ BAD: `import { something } from '@bh/backend/lib/services/...'`

## Error Handling

- **Zod validation at every route boundary** — all API inputs validated before reaching the handler.
- **Never catch and silently swallow.** If you catch, handle or re-throw.
- **No bare `throw "string"`** — always throw typed errors (Zod issues, custom classes, or `HttpError`).
- **Global error handler** catches the rest, logs, and returns a structured response.

✅ GOOD: `throw new HttpError(400, 'Invalid product slug')`
❌ BAD: `throw "something went wrong"` or `try { ... } catch {}`

## Testing Standards

- **Framework**: Vitest across the monorepo.
- **Levels**: Unit → service logic and pure functions. Integration → routes with test DB. E2E → critical paths (submission, feed, auth).
- **Deterministic** — no shared state between files, no network in unit tests, no timing deps.
- **Characterization** — before changing a module, run its tests and confirm they pass.

✅ GOOD: `productService.test.ts` co-located with `productService.ts`
❌ BAD: tests that share a global counter, or unit tests that hit a real API

## Type Discipline

- **Strict mode** is non-negotiable — `tsconfig.json` has `"strict": true`.
- **No `any`** — use `unknown` and narrow with type guards.
- **Generics over `as` casts** — prefer a generic parameter over a type assertion.
- **Zod `z.infer`** over hand-written types that duplicate schemas.

✅ GOOD: `z.infer<typeof productSchema>`
❌ BAD: `const x = result as any`

## Documentation Requirements

- **Every public API gets a JSDoc comment** — route handlers, service exports, shared types.
- **Complex modules get a module-level comment** explaining *why*, not *what*.
- **Architecture decisions go in `docs/adr/`**.
- **No "how it works" inline comments** — code documents itself. Comments explain rationale.

✅ GOOD: `/** Returns the ranked feed for a given week. Filters by category if provided. */`
❌ BAD: `// This loops over the products array and filters...`

## Commit Conventions

- **Conventional Commits**: `type(scope): description` — e.g., `feat(backend): add category filter`.
- **Types**: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`.
- **Scopes**: `backend`, `frontend`, `shared`, `deps`.
- **Branch naming**: `type/description` — e.g., `feat/category-filter`.
- **PRs reference issues**: `Closes #N` in the body.

✅ GOOD: `feat(backend): add category filter to product feed`
❌ BAD: `fix stuff`

## Performance & Security Constraints

- **Rate limiting** on all routes — stricter on auth and submission endpoints.
- **Sanitize** all user-generated content before storage (`sanitize-html`).
- **Helmet** applied globally for security headers.
- **No secrets in code** — env vars only (`.env` never committed).
- **No raw SQL** — use Prisma's parameterized queries.

---

## Boundary System

| Always Do | Ask First | Never Do |
|---|---|---|
| Add a new file for new behaviour | Change a shared type | Add branches to existing code |
| Run `npm run format && npm run lint` before pushing | Introduce a new package dependency | Use `any` |
| Validate all inputs with Zod at the boundary | Add a new npm package | Write raw SQL |
| Use Conventional Commits | Refactor a file without running its tests first | Commit secrets |

## Verification

Before marking a PR ready, run:

```bash
npm run lint && npm run test
```

If the above fails, investigate and fix before requesting review.
