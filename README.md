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

## Design

The look is editorial with a technical HUD layer: rounded sheets on warm paper, alternating light and ink,
Space Grotesk headlines, JetBrains Mono labels, and lime and orange signal colors. On top of that sit HUD
callouts, windowed readout panels, barcodes, a blueprint grid, and pixel-based motion.

- **Scan reveal:** on a card page, the card's own PNG is sampled into a dot cloud that assembles top to
  bottom behind a lime scan line, resolves from chunky pixels to sharp, then swaps to the live 3D card. Hairline
  callouts then draw out to its rating, subject, stats and ability. Tap to skip; "Rescan" replays it.
- **Hero:** a featured card shown as an interactive dot matrix (Aceternity `PixelatedCanvas`) that scatters
  under the pointer, with HUD tags. "Change view" swaps it for the live card.
- **Pixel motion:** headings rez in through blocks that blink out, stat bars fill segment by segment, and
  labels decode from scrambled characters (Aceternity `EncryptedText`).
- **3D card:** a spring tilt with layered depth, pointer glare and rarity foils. The "how it works" stack uses
  the Aceternity 3D card, so its layers pop apart on hover.
- **Compare:** player 1 in lime, player 2 in orange, with mirrored segment bars, a two-player radar and a verdict.
- **Leaderboards:** a top-3 podium, a lineup list, and a card preview that follows the pointer.
- **Reduced motion:** with the OS setting on, scans are skipped and motion is made instant.

UI: Tailwind v4, shadcn/ui (button, badge, input, separator, tooltip) and Aceternity UI (pixelated-canvas,
encrypted-text, dotted-glow-background, 3d-card, infinite-moving-cards, animated-tooltip), with `motion`
for animation. Fonts are self-hosted via Fontsource.

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

Next.js 15 (App Router), TypeScript, Tailwind v4, shadcn/ui, Aceternity UI and `motion`. There's no database. Images are rendered with `next/og`,
and caching uses `unstable_cache`. Deploys to Vercel as-is: set `GITHUB_TOKEN` and `NEXT_PUBLIC_SITE_URL`.

## Layout

```
src/lib/github.ts     GitHub GraphQL + search
src/lib/stats.ts      scoring: stats, overall, rarity, moves, abilities
src/lib/cards.ts      cached card + leaderboard loaders
src/lib/render.tsx    PNG renderers (card, slab, OG image)
src/lib/demo.ts       demo-mode fake data
src/components/       DevCard, Materialize (scan reveal), CardHud, HeroScan, hud.tsx (HUD kit)
src/components/ui/    shadcn + Aceternity components
src/app/              pages: /, /u/[username], /compare, /leaderboard, /binder, /api/card/...
```
