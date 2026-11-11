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
- **Motion** — the `ascii-reveal` library decodes content in through a character grid: hero uses the `terminal` preset's cinematic wave, cards use `decode` + `data-ascii="surface"`. A slow gray gradient drifts behind everything, with a static film-grain overlay (SVG turbulence, strength and tile size from the `--noise-opacity` / `--noise-size` tokens — light mode uses a larger grain). Both respect `prefers-reduced-motion`.

Everything color- and type-related is tokenized in [`src/theme/theme.ts`](src/theme/theme.ts) and published to CSS variables from there — no component knows a hex value.

## Pages

| Route | Contents |
|-------|----------|
| [`#/`](https://tanishworks.github.io/tagg/) | Hero + CTA, four feature cards |
| `#/gameplay` | Hunter/hider roles, a round step-by-step |
| `#/docs` | Stack cards + the endpoint terminal, then the docs area: category-separated markdown (Concepts / Reference / Repository) with a two-level drawer sidebar |

Pill nav floats center-screen above the page in a transparent container (see `FloatingNav` in `src/App.tsx`); the active indicator slides between tabs (DOM-measured, animated transform). It slides up while scrolling down and comes back on scroll-up, near the page top, or when the pointer nears the top edge. On `#/docs` a circle hamburger (matching the pill's color scheme, no container background) sits immediately left of the pill and opens the docs sidebar; the sidebar itself only exists on the docs page. There is no top bar: the app icon (`SiteMark`) stands alone top-left, and the theme toggle is fixed to the left edge, vertically centered (hidden on mobile).

## Docs

The `#/docs` reference is authored as plain markdown in `src/content/docs.md` (imported with Vite's `?raw`), rendered once at load by `src/lib/markdown.ts` using `marked`. Markdown heading levels map to the page structure: **H2 = broad category**, rendered as the section-head separator (kicker auto-numbered to continue the JSX sections, via `KICKER_BASE` in `markdown.ts`) and **H3 = section** (slugged id, `.docs-h3`). `docHeadings()` extracts both levels so the two-level sidebar (categories bold, sections indented; active one bolded by scroll-spy) updates when the markdown does. Fenced code blocks become terminal windows, external links get `target="_blank"`. The sidebar UI lives in `src/components/DocsShell.tsx`; open state in `src/lib/useDocsSidebar.tsx` (the circle hamburger, immediately left of the floating pill nav, is rendered by `FloatingNav` in `App.tsx`). Below 960px the sidebar is an overlay drawer (closed by default, closes after a jump); at 960px+ it is a persistent left rail (open by default, toggled by the hamburger) and the page content shifts right while open. Adding a doc section means editing the markdown file — no markup needed.

## Structure

```
src/
├── theme/            # tokens + ThemeProvider/useTheme (all colors live here)
├── content/          # docs.md — markdown source for the docs area
├── lib/              # hash router, markdown renderer, sidebar state, font gate
├── components/       # PillNav, Icons, DocsShell (docs sidebar)
├── pages/            # Home, Gameplay, Docs
├── App.tsx           # SiteMark (icon), side toggle, FloatingNav (pill + hamburger), pages, footer
└── index.css         # styles (consumes only theme CSS variables)
```

## Architecture notes

- **Floating pill nav** — the pill lives in a transparent fixed container with a `1fr auto 1fr` grid, so the pill stays pixel-identical center-screen whether the docs hamburger is present. It hides on scroll-down, returns on scroll-up / page top / pointer-near-top (rAF-coalesced scroll check).
- **Docs sidebar state** is one React context (`src/lib/useDocsSidebar.tsx`) shared by the floating hamburger and the sidebar: overlay drawer below 960px, persistent left rail above; chosen once at mount by viewport width.
- **Docs areas build themselves** — markdown `H2` = category (auto-numbered kicker), `H3` = slugged section; sidebar + scroll-spy derive from the markdown, not components.
- **Pages remount on navigation** (`key={route}`) so ascii-reveal decodes in again; content is held until webfonts are verified loaded (`useFontsReady`) or a 2.5s fallback fires, so reveals measure in the final font.

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
- Automatic: `.github/workflows/deploy-website.yml` on pushes to `main` that change build inputs or the workflow (root-level `README`/`AGENTS.md` edits don't rebuild the site, but markdown inside `website/src/` — e.g. the docs content — does).
- Manual: `npm run deploy` (from `website/`).

Routes are hash-based (`#/#/`, `#/gameplay`, `#/docs`) so pages work on GitHub Pages without rewrite rules; the Vite `base` `/tagg/` in `vite.config.ts` matches the Pages URL.

## Agents

If you are an AI agent editing this folder, read [`AGENTS.md`](AGENTS.md) first — it documents the token rules, font hierarchy, ascii-reveal conventions and known gotchas.

## License

MIT, same as the repository.
