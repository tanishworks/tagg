# Tagg — project website

Vite + React (TypeScript) landing site for Tagg, deployed to GitHub Pages from the `gh-pages` branch.

## Design system

- **Monochrome only.** Pure black / pure white with neutral grays for hierarchy. Every color on the site comes from `src/theme/theme.ts` — nothing is colored elsewhere.
- **Two fonts.** `JetBrains Mono` (terminal) for body text and UI, `Press Start 2P` (pixel) for display headings and buttons.
- **ascii-reveal.** The hero title and cards decode in through a character grid using [`ascii-reveal`](https://quanhoangindex.github.io/ascii-reveal) (`terminal` + `decode` presets).
- **Theme hook.** `useTheme()` from `src/theme/ThemeProvider.tsx` provides the active mode (`dark` / `light`), the palette, and a toggle. Colors are emitted as CSS variables by `themeToCssVars()`; `.pill` nav and other components only consume variables.

## Structure

- `src/theme/theme.ts` — single source of truth for colors + font tokens
- `src/theme/ThemeProvider.tsx` — context, `useTheme()` hook, persistence
- `src/lib/useHashRoute.ts` — tiny hash router (`#/#/`, `#/gameplay`, `#/docs`) so routes work on GitHub Pages without rewrite rules
- `src/components/PillNav.tsx` — pill nav with a DOM-measured sliding active indicator
- `src/components/Icons.tsx` — GitHub + theme toggle icon buttons
- `src/pages/` — Home, Gameplay, Docs

## Scripts

```sh
npm run dev      # dev server
npm run build    # tsc + vite build
npm run deploy   # build + push dist/ to the gh-pages branch
```

`/tagg/` base path is set in `vite.config.ts` to match the GitHub Pages URL (`tanishworks.github.io/tagg`). CI: `.github/workflows/deploy-website.yml` rebuilds and republishes on every push to `main` touching `website/`. To host: enable GitHub Pages with source branch `gh-pages` (root).
