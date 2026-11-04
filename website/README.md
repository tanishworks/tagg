# Tagg — project website

The landing site for **Tagg**, deployed at **https://tanishworks.github.io/tagg/**

Vite + React + TypeScript. Source lives in `website/` of the [tagg repo](https://github.com/tanishworks/tagg); every push to `main` touching `website/` is built and published to the `gh-pages` branch.

## Design system

Monochrome, terminal-flavored minimalism:

- **Color** — pure black/pure white backgrounds and text, with neutral grays for hierarchy. No hue anywhere; handlers, glows and gradients are gray alphas. Two modes: dark (default) and light.
- **Type** — three-tier hierarchy (all self-hosted in `public/fonts`):
  | Tier | Font | Used for |
  |------|------|----------|
  | Display | Press Start 2P | Hero titles, CTAs, section kickers, card titles, step numbers, brand |
  | Body / UI | Inter | Paragraphs, pill-nav labels, section headings, footer |
  | Terminal | JetBrains Mono | Terminal windows, `//` eyebrows, card indexes, decode-glyph effect |
- **Motion** — the `ascii-reveal` library decodes content in through a character grid: hero uses the `terminal` preset's cinematic wave, cards use `decode` + `data-ascii="surface"`. A slow gray gradient drifts behind everything. Both respect `prefers-reduced-motion`.

Everything color- and type-related is tokenized in [`src/theme/theme.ts`](src/theme/theme.ts) and published to CSS variables from there — no component knows a hex value.

## Pages

| Route | Contents |
|-------|----------|
| [`#/`](https://tanishworks.github.io/tagg/) | Hero + CTA, four feature cards |
| `#/gameplay` | Hunter/hider roles, a round step-by-step |
| `#/docs` | Lobby HTTP endpoints (terminal window), stack cards, repo map |

Pill nav centered at the top; the active indicator slides between tabs (DOM-measured, animated transform). GitHub + theme-toggle icons sit top-right.

## Structure

```
src/
├── theme/            # tokens + ThemeProvider/useTheme (all colors live here)
├── lib/              # hash router + constants
├── components/       # PillNav, Icons
├── pages/            # Home, Gameplay, Docs
├── App.tsx           # layout: header, pages, footer
└── index.css         # styles (consumes only theme CSS variables)
```

## Scripts

```sh
npm run dev       # dev server
npm run build     # tsc + vite build
npm run lint      # oxlint
npm run preview   # serve dist/ at /tagg/
npm run deploy    # build + push dist/ to the gh-pages branch
```

## Hosting

GitHub Pages serves the `gh-pages` branch (root):
- Automatic: `.github/workflows/deploy-website.yml` on pushes to `main` that change build inputs or the workflow (`README`/`AGENTS.md` edits don't rebuild the site).
- Manual: `npm run deploy` (from `website/`).

Routes are hash-based (`#/#/`, `#/gameplay`, `#/docs`) so pages work on GitHub Pages without rewrite rules; the Vite `base` `/tagg/` in `vite.config.ts` matches the Pages URL.

## Agents

If you are an AI agent editing this folder, read [`AGENTS.md`](AGENTS.md) first — it documents the token rules, font hierarchy, ascii-reveal conventions and known gotchas.

## License

MIT, same as the repository.
