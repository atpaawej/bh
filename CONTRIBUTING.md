# Contributing

Thanks for wanting to contribute to BharatHunt! 🇮🇳

## Getting Started

1. Fork the repo
2. Clone your fork: `git clone https://github.com/your-username/bh.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` → `.env` and fill in your values
5. Run `npm run dev` to start development

## Development Workflow

- **Frontend**: `cd packages/frontend && npm run dev`
- **Backend**: `cd packages/backend && npm run dev`
- **Shared**: Types are auto-imported by the packages

## Code Style

- TypeScript strict mode everywhere
- No `any` — if you need it, define a type
- Services are pure functions — no HTTP context
- Prettier formatting (`npm run format`)

## Pull Request Process

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Ensure lint passes: `npm run lint`
4. Open a PR with a clear title and description

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add scheduled launch support`
- `fix: prevent duplicate vote race condition`
- `docs: update API endpoints in README`

## Code of Conduct

Be respectful. Be constructive. We're all here to build something great for the Indian maker community.
