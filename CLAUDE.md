# Coding standards

Follow [CODING_STANDARDS.md](./CODING_STANDARDS.md) for architecture rules, naming, testing, and type discipline. Non-negotiable for all code changes.

# Agent skills

### Issue tracker

Issues live in GitHub Issues. Use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.

### Deep modules

Packages are deep modules — see [packages/README.md](./packages/README.md) before adding or importing one.
