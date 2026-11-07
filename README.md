# Dev Cards

Turn any GitHub profile into a collectible, shareable card in the style of football and trading cards. Every
number on the card is computed from real public GitHub data. There's no sign-in: just type a username.

## Features

- **Card**: an overall rating and six stats, a role (like a football position) from your best stat, and an
  element (like a Pokémon type) from your main language. Click the card to flip it.
- **Moves**: your top 3 repos (stars, forks, whether they're deployed, releases, lifespan) become moves with a
  power number. Deployed projects are tagged `LIVE`.
- **Abilities**: traits unlocked by patterns, such as *Unbreakable* (60+ day streak), *Ship It* (3+ deployed
  projects), *Polyglot*, *Weekend Warrior*, *Crowd Favorite* and *Reviewer's Eye*.
- **Rarity**: Bronze (<58), Silver (58–71), Gold (72–84) and Legacy (85+). Legacy cards come in a graded slab.
- **Sharing**: a "Share on X" button, a 1200×630 Open Graph image so links unfurl as the card, and a
  "Download PNG" button.
- **Compare**: put two developers head to head, stat by stat (`/compare?a=foo&b=bar`).
- **Binder**: collect cards. The binder is stored in your browser, and you can pick two cards to compare.
- **Leaderboards**: by country or by stack. Built without a database: GitHub user search finds the most-followed
  developers for a `location:` / `language:`, the app scores them live, and caches the result for 6 hours.

## Interactions

- **Pack opening:** every card page starts with a sealed foil pack that glows in the rarity's color. Tap it
  (or wait) and it shakes, the top tears off, the screen flashes, light rays spin up, and the card spins out
  in a confetti burst while its numbers count up. "Rip another" replays it.
- **3D card:** a spring-driven tilt follows the pointer. The avatar, rating, name and stats sit on separate
  depth layers that lift toward you, with a glare that tracks the pointer. Foil changes with rarity: a sheen on
  bronze and silver, sparkle foil and a shine sweep on gold, and full prismatic holo on Legacy, under a
  graded-slab glass layer. Cards sway when idle, and clicking or pressing Enter flips them to the moves.
- **Compare:** the cards fly in and collide, "VS" slams in with a burst, the stat bars race one by one,
  a two-player radar draws itself in, and the winner gets a glow.
- **Leaderboards:** the top three rise onto a podium, with rays behind #1. Rows slide in, and hovering a row
  shows a card preview that follows the pointer.
- **Home:** words blur into view, the card fan spreads on hover, two rows of cards scroll endlessly,
  the search box has a typewriter placeholder and a spinning border, and panels light up where the pointer is.
- **Binder:** hovering a card blurs the rest, and adding or removing cards animates.
- **Reduced motion:** with the OS setting on, the pack is skipped and transform animations turn instant.

Animation uses [`motion`](https://motion.dev). Everything else is CSS: 3D transforms, conic and repeating
gradients, and blend modes.

## Stats

| Stat | Name | What feeds it |
| --- | --- | --- |
| SHP | Shipping | Commits, PRs, releases and deployed projects in the last 12 months |
| CON | Consistency | Active days and longest streak over the last 12 months |
| RNG | Range | Effective number of languages (Shannon entropy over language bytes) plus count of serious languages |
| DEP | Depth | Size and lifespan of your biggest projects, plus years on GitHub |
| IMP | Impact | Stars, forks and followers (log scale) |
| COL | Collab | PRs, reviews, issues and repos you contributed to |

The overall rating is a weighted average plus a small bonus for your two best stats, so specialists can shine.
All formulas are in `src/lib/stats.ts`.

## Running it

```bash
npm install
cp .env.example .env.local   # add a GITHUB_TOKEN (public read access is enough)
npm run dev
```

The GitHub GraphQL API requires a token even for public data. The token is used only on the server. Cards are
cached for 6 hours per user.

**Demo mode:** run `DEV_CARDS_DEMO=1 npm run dev` to work on the UI without a token. Every username gets
deterministic, made-up stats. Never set this in production.

## Stack

Next.js 15 (App Router) and TypeScript, with plain CSS and `motion` for animation. There's no database. Images are rendered with `next/og`,
and caching uses `unstable_cache`. Deploys to Vercel as-is: set `GITHUB_TOKEN` and `NEXT_PUBLIC_SITE_URL`.

## Layout

```
src/lib/github.ts     GitHub GraphQL + search
src/lib/stats.ts      scoring: stats, overall, rarity, moves, abilities
src/lib/cards.ts      cached card + leaderboard loaders
src/lib/render.tsx    PNG renderers (card, slab, OG image)
src/lib/demo.ts       demo-mode fake data
src/components/       DevCard (flip, holo, slab), actions, binder
src/app/              pages: /, /u/[username], /compare, /leaderboard, /binder, /api/card/...
```
