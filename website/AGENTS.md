# Tagg Website (`website/`)

Agent-facing instructions for the Vite + React (TypeScript) project site. Human-facing docs: [`./README.md`](./README.md).

## Hard rules

1. **Never hardcode a color.** Every color token lives in `src/theme/theme.ts` (2 modes: dark = pure black bg / white fg, light = inverse, plus neutral grays for hierarchy). Components consume tokens only through:
   - CSS variables published on `:root` by `ThemeProvider` (`--color-*`, `--gradient-*`), or
   - `useTheme()` from `src/theme/ThemeProvider.tsx`.
   Even a one-off color used exactly once must become a token.
2. **Never hardcode a font-family outside tokens.** `FONT_TOKENS` in `theme.ts` defines the hierarchy:
   - `---font-pixel` ("Press Start 2P") — display: hero titles, CTAs, kickers, card titles, step numbers, brand.
   - `--font-sans` ("Inter") — body and UI text.
   - `--font-mono` ("JetBrains Mono") — terminal accents: terminal windows, eyebrows (`// ...`), card indexes, ascii-reveal glyphs (`--ascii-font`).
3. **The color tokens in `index.html`'s inline script are the only sanctioned duplication** (`html` bg hexes pre-paint, before root CSS vars exist). Keep them in sync with `bg` tokens in `theme.ts`.
4. **Do not add new CSS variables or colors in `src/index.css`** — it consumes variables only. Exceptions must go through `theme.ts` first.
5. **ascii-reveal colors are derived, not library defaults**: the `--ascii-accent`, `--ascii-glyph`, `--ascii-skeleton`, `--ascii-flash`, `--ascii-font` block on `.site` in `index.css` maps them to theme tokens. Do not let them fall back to the library's default blue accent.

## Commands

Run from `website/`:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | TypeScript check (`tsc -b`) + Vite build |
| `npm run lint` | oxlint |
| `npm run preview` | Serve `dist/` locally at `/tagg/` |
| `npm run deploy` | Build + publish `dist/` to the `gh-pages` branch (manual deploys only) |

Live URL: https://tanishworks.github.io/tagg/ (`base: '/tagg/'` in `vite.config.ts` must match the Pages URL).

## Deployment

- CI: `.github/workflows/deploy-website.yml` builds and publishes to `gh-pages` on every push to `main` touching website **build inputs** (`src/`, `public/`, `index.html`, `vite.config.ts`, tsconfigs, package/lock files) or the workflow file itself. Markdown-only edits inside `website/` do not trigger a deploy.
- Pages: repo setting → branch `gh-pages`, root.
- `npm run deploy` and CI both push to `gh-pages`; running them simultaneously races on the same ref (two builds, one branch). Prefer CI; use the manual script only when CI is unavailable.
- Hash routing (`#/#/`, `#/gameplay`, `#/docs`) is used instead of react-router **because** GitHub Pages can't rewrite unknown paths without a custom 404 hack.

## Architecture (files → what they do)

- `src/theme/theme.ts` — single source of truth: `ThemePalette` per mode, `FONT_TOKENS`, `themeToCssVars()` flattener (`var` names map 1:1 to palette keys).
- `src/theme/ThemeProvider.tsx` — context + `useTheme()` hook. Publishes tokens to `document.documentElement` (`:root`), not to any component — `html/body` and fixed layers must read them. Initial mode: stored override → `prefers-color-scheme` → dark. The `matchMedia('change')` listener follows the OS live unless a stored override exists.
- `src/lib/useHashRoute.ts` — routes table + `Route` type + `GITHUB_URL`.
- `src/components/PillNav.tsx` — sliding active indicator, measured from the DOM (`offsetLeft/offsetWidth`). Re-measures on: active-tab change, window resize, `document.fonts.ready` (font swap shifts widths). Adding a nav page = entry in `ROUTES` + `App.tsx` `PAGES`/`NAV_ITEMS`.
- `src/components/Icons.tsx` — inline SVG icons (GitHub, sun/moon). No icon library on purpose.
- `src/pages/` — Home, Gameplay, Docs. Page components remount per navigation (`key={route}`) so ascii-reveal decodes in again.
- `src/index.css` — all styling; sections commented. Monochrome only.

## ascii-reveal conventions (`npm i ascii-reveal`, docs: https://quanhoangindex.github.io/ascii-reveal/)

- Hero: `<AsciiReveal preset="terminal" duration="cinematic">` wrapping eyebrow/display/tagline/CTAs.
- Card grids: one `<AsciiReveal preset="decode">` per section; cards carry `data-ascii="surface"`; links/buttons `data-ascii="fade"`.
- `data-ascii="skip"` must be used for anything that must stay interactive immediately (e.g. terminal window chrome rows).
- Pages remount on navigation → one decode wave per visit. Do not fight this; it's intended.

## Gotchas

- Theme variables live on `:root` after React mounts; the two hex fallbacks in CSS (`html[data-theme=...]`) cover the pre-JS paint only.
- `<StrictMode>` double-mounts effects in dev — ascii-reveal reveals twice in dev is normal, production is single-pass.
- `website/` uses **2-space style + oxlint** (Vite conventions). The root Prettier `tabWidth: 4` does not apply here.
- `Press Start 2P` renders heavy; keep it clamp()-sized and reserve it for short strings.
- If you bisect a "background is wrong" report, check that tokens are still published on `:root` in `ThemeProvider` — an earlier version published them on a div and the page stayed black in light mode.
