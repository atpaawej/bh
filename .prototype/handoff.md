# Handoff: BharatHunt Design System

## Status

**Chosen direction: Cohere-inspired** (`.prototype/cohere/`).

All other prototype explorations (ClickHouse, AI Hero, Bharat Custom / Rang, Matt Pocock) were removed after the user selected this design system as the one to keep.

## Project

**BharatHunt** — ProductHunt-style platform for Indian makers. Repo: `atpaawej/bh`.

## GitHub Issue

[#1 — Frontend Design System — prototype & asset pipeline](https://github.com/atpaawej/bh/issues/1)

## Canonical prototype

```
.prototype/cohere/
  DESIGN.md           # getdesign source (Cohere tokens)
  styles.css          # implemented design system
  index.html
  product.html
  launch.html
  login.html
  category.html
  leaderboard.html
  user.html
```

### Vibe
White editorial canvas · deep green product bands · near-black pill CTAs · coral taxonomy chips · soft stone cards · monumental type

### Tokens (implement these in Tailwind / CSS vars)

| Token | Value | Role |
|--------|--------|------|
| Canvas | `#ffffff` | Default page background |
| Primary | `#17171c` | Near-black pill CTAs, dark footer |
| Deep green | `#003c33` | Capability / product bands |
| Dark navy | `#071829` | Alternate dark bands |
| Soft stone | `#eeece7` | Product cards, stone sections |
| Coral | `#ff7759` | Filter chips, warm accents only |
| Coral soft | `#ffad9b` | Chip borders |
| Ink | `#212121` | Body text |
| Muted | `#93939f` | Metadata, footer links |
| Action blue | `#1863dc` | Editorial links |
| Hairline | `#d9d9dd` | Dividers |

### Typography
- **Display**: Space Grotesk (fallback for CohereText)
- **Body**: Inter (fallback for Unica77)
- **Mono labels**: JetBrains Mono

### Radius
4 / 8 / 16 / 22 / 30 / 32 (pill) — media cards use **22px**, product cards **8px**, CTAs **pill**

### Open
Open `.prototype/cohere/index.html` in a browser. Pure HTML/CSS, no build step.

## Next steps (issue #1 deliverables)

1. ~~Clickable prototype~~ — done (Cohere)
2. Design token specification → fold into Tailwind config / CSS variables
3. Asset exports (logo, icons)
4. Reusable React components in `packages/frontend`
5. Capture verdict on issue #1 and promote tokens into the real app

## Decisions locked in

1. **Design system**: Cohere-inspired light editorial (not dark yellow / gold / saffron explorations)
2. **No Figma intermediate** — HTML/CSS prototype is the source of truth
3. **Emotional, community-first copy** (no developer code-block hero)
4. **Demo data**: Krutrim AI, Rain Drop, Bharat Pay, PhyROS, Docs Up!, Rush India
