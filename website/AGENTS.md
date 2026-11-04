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
- `src/components/Icons.tsx` — inline SVG icons (GitHub, sun/moon). No icon library on purpose. Header docs-toggle bars are CSS-drawn spans (currentColor), not glyphs, so no font's glyph coverage matters.
- `src/lib/useDocsSidebar.tsx` — shared open/closed state for the docs sidebar (context: header toggle + DocsShell). Initial value: open at ≥960px, closed below; set once, resize doesn't override.
- `src/components/DocsShell.tsx` — docs sidebar (drawer <960px with scrim + Esc close; persistent left rail ≥960px) + IntersectionObserver scroll-spy (bold active section) over the page's section ids.
- `src/lib/useDocsSidebar.tsx` — shared open/closed state for the docs sidebar (context: floating hamburger + DocsShell). Initial value: open at ≥960px, closed below; set once, resize doesn't override.
- `src/components/DocsShell.tsx` — docs sidebar (drawer <960px with scrim + Esc close; persistent left rail ≥960px) + IntersectionObserver scroll-spy (bold active section) over the page's section ids. Mounted only inside the Docs page.
- `src/App.tsx` — `SiteHeader` is a plain in-flow bar (brand left, icons right). `FloatingNav` is a transparent fixed container holding the PillNav centered (`1fr auto 1fr`, explicit columns — the pill does not move when the hamburger mounts) that slides up on scroll-down and back on scroll-up / top-page / pointer-near-top (rAF-coalesced, >4px delta past 120px scroll; pointer within 40px). The docs hamburger renders only on `#/docs`, left of the pill.
- `src/pages/` — Home, Gameplay, Docs. Page components remount per navigation (`key={route}`) so ascii-reveal decodes in again.
- `src/content/docs.md` — markdown source for the docs area. Authored plain; rendered by marked at module load (`import ...?raw`).
- `src/lib/markdown.ts` — marked (v18, token-object renderer API) config. **Markdown H2 = docs category** → rendered as a section-head separator with an auto-numbered kicker (`KICKER_BASE` = number of JSX sections before the docs; keep in sync) and **H3 = section** → slugged id + `.docs-h3`. Fenced code → terminal window, http(s) links → new tab. `docHeadings()` extracts both levels for the sidebar.
- `src/index.css` — all styling; sections commented. Monochrome only.

## ascii-reveal conventions (`npm i ascii-reveal`, docs: https://quanhoangindex.github.io/ascii-reveal/)

- Hero: `<AsciiReveal preset="terminal" duration="cinematic">` wrapping eyebrow/display/tagline/CTAs.
- Card grids: one `<AsciiReveal preset="decode">` per section; cards carry `data-ascii="surface"`; links/buttons `data-ascii="fade"`.
- `data-ascii="skip"` must be used for anything that must stay interactive immediately (e.g. terminal window chrome rows).
- Pages remount on navigation → one decode wave per visit. Do not fight this; it's intended.

## Docs area conventions (`#/docs`)

- **Adding docs = writing markdown.** H2 (`##`) starts a broad category (auto kicker + section-title separator); H3 (`###`) adds a section under it. The sidebar picks both up via `docHeadings()` — no component or CSS edits needed.
- **Keep `KICKER_BASE` in sync** (`markdown.ts`): it must equal the number of JSX sections above the docs (currently 2: STACK, API), so the first category renders as 03.
- **Sidebar open state is shared** (`useDocsSidebar`): the floating hamburger (left of the pill nav, `#/docs` only) and DocsShell flip the same boolean. Jumping closes it only below 960px (overlay drawer); the rail persists on wide screens.
- Keep the `DOC_SECTIONS` list in `Docs.tsx` in sync with JSX section ids (`stack`, `api`) and their `level` (0 = category, 1 = section) if you add headings outside the markdown.
- Interactive sidebar chrome carries `data-ascii="skip"`; the article decodes in through the wrapping `<AsciiReveal preset="decode">` (lazy below the fold).
- **Section anchors are ids, not hrefs.** The hash router owns `location.hash`, so sidebar links must `scrollIntoView` to the slugged H2 id (as DocsShell does) — never navigate via `href="#slug"`, which would clobber the route.
- New markdown elements (best effort): if you use a block type the CSS doesn't style yet (e.g. `hr`), add a `.docs-article` rule consuming tokens only.

## Gotchas

- ascii-reveal measures ONCE per reveal, so page content is gated behind `useFontsReady()` (`src/lib/useFontsReady.ts`): reveals start only after the local `fonts.css` is loaded, `document.fonts.ready` resolves, and every family/weight used at first paint is explicitly `fonts.load()`ed. If you add a font weight/family for first-paint text, update the `weightsByFamily` map in that hook **and** add a `@font-face` in `public/fonts.css`. A ~2.5 s fallback unblocks failed font loads (fallback fonts are then used). While waiting, `<AsciiSkeleton>` shows in `App.tsx`.
- Fonts are **self-hosted**: `public/fonts/*.woff2` (latin subset) + `public/fonts.css`, sourced from the `@fontsource/*` devDependencies (update by reinstalling and re-copying files; licenses `public/fonts/*-OFL.txt`). The four critical files are preloaded in `index.html` (Inter 400/600, JetBrains Mono 400, Press Start 2P 400); no third-party font requests exist, so do not reintroduce Google Fonts links.

- Theme variables live on `:root` after React mounts; the two hex fallbacks in CSS (`html[data-theme=...]`) cover the pre-JS paint only.
- `<StrictMode>` double-mounts effects in dev — ascii-reveal reveals twice in dev is normal, production is single-pass.
- `website/` uses **2-space style + oxlint** (Vite conventions). The root Prettier `tabWidth: 4` does not apply here.
- `Press Start 2P` renders heavy; keep it clamp()-sized and reserve it for short strings.
- If you bisect a "background is wrong" report, check that tokens are still published on `:root` in `ThemeProvider` — an earlier version published them on a div and the page stayed black in light mode.
