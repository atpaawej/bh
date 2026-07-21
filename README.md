<div align="center">
  <br/>
  <pre>
██╗  ██╗██╗██████╗ ██████╗ ███████╗███╗   ██╗████████╗██╗  ██╗██╗   ██╗███╗   ██╗████████╗
██║  ██║██║██╔══██╗██╔══██╗██╔════╝████╗  ██║╚══██╔══╝██║  ██║██║   ██║████╗  ██║╚══██╔══╝
███████║██║██████╔╝██████╔╝█████╗  ██╔██╗ ██║   ██║   ███████║██║   ██║██╔██╗ ██║   ██║
██╔══██║██║██╔══██╗██╔══██╗██╔══╝  ██║╚██╗██║   ██║   ██╔══██║██║   ██║██║╚██╗██║   ██║
██║  ██║██║██████╔╝██║  ██║███████╗██║ ╚████║   ██║   ██║  ██║╚██████╔╝██║ ╚████║   ██║
╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝
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
    <a href="#-architecture">Architecture</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="#-license">License</a>
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
- **Launch instantly** or **schedule** for the next weekly cycle
- Beautiful product pages with logo, hero image, gallery, and video embeds
- Real-time feedback via community votes and comments
- Maker profiles to showcase everything you've built

### 🗳️ For the Community
- **Weekly ranked feed** (Friday → Thursday) — every product gets a fair shot
- One upvote per product per user — your vote matters
- Category filters to find exactly what interests you
- Nested comments for genuine conversations

### 🔒 Built Right
- **All auth handled server-side** — JWTs in memory, refresh tokens in HTTP-only cookies
- **Rate limited, validated, sanitized** — bots and bad actors kept out
- **Ownership enforced everywhere** — you own your content, period

---

## 🏗 Architecture

```
bh/
├── packages/
│   ├── frontend/          # Next.js + Tailwind CSS app
│   ├── backend/           # Express + TypeScript API
│   └── shared/            # Shared types, constants, contracts
├── package.json           # Turborepo root
└── turbo.json             # Pipeline configuration
```

**Architecture rules:**
- `frontend → shared ← backend`
- Backend follows: `routes → controllers → services → db`
- Services are pure TypeScript — zero HTTP knowledge
- All contracts live in `packages/shared` — frontend and backend stay in sync

Read the full design decisions in [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Backend | TypeScript + Express |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| Auth | Supabase Auth (Magic link + Google + GitHub) |
| Media | Cloudinary |
| Monorepo | Turborepo |
| Deploy | Vercel (frontend) + TBD (backend) |

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/atpaawej/bh.git
cd bh

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase, Cloudinary, and JWT secrets

# Start development
npm run dev
```

---

## 🤝 Contributing

BharatHunt is open source and welcomes contributors.

- **Found a bug?** Open an issue
- **Want a feature?** Start a discussion
- **Code changes?** Open a PR with a clear description

Read the full guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📜 License

[MIT](LICENSE) — do what you love, give credit where it's due.

---

<div align="center">
  <br/>
  <p>
    Built with ❤️ for the Indian maker community.
    <br/>
    <sub>Made in India 🇮🇳</sub>
  </p>
  <br/>
</div>
