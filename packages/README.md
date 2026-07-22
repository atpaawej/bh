# Packages — Deep Module Convention

Every package under `packages/` is a **deep module**: a lot of behaviour behind a small interface.

## Layout

```
packages/<name>/
  index.ts        ← entry point (public). Import this from outside.
  client.ts       ← another entry point. Packages may expose SEVERAL.
  lib/            ← implementation: hidden from outside, free to import each other.
  tests/          ← co-located tests + fixtures (a subfolder, so private).
```

The public surface is every **root file** (`index.ts`, `client.ts`, `server.ts`, etc.) — not just one barrel. Implementation lives in `lib/` and tests in `tests/`.

## Import rules

1. **Entry-point boundary** — code outside a package may import only that package's entry points (its root files), never anything in its subfolders.
2. **Intra-package freedom** — a package's own files import each other freely.
3. **Tests through the entry points** — test files may import any package's entry points and their own `tests/` fixtures, but never any package's subfolder internals (not even their own).
4. **No cycles** — no dependency cycles between packages.

## ❌ Don't

```ts
// Bad — importing from a subfolder, which is private
import { formatVoteCount } from '@bh/example/lib/format'

// Bad — barrel file that re-exports a whole subtree
export * from './lib/something'
```

## ✅ Do

```ts
// Good — importing a root-level entry point
import { engagementSummary } from '@bh/example'
```

## Run the check

```bash
npm run lint:boundaries
```

This uses dependency-cruiser to enforce the rules. It runs as part of `npm run lint`.
