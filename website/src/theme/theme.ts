import type { CSSProperties } from 'react'

/**
 * Single source of truth for every color on the site.
 *
 * Rules:
 * - Components never hardcode a color. They read CSS variables that are
 *   derived from this file (see `themeToCssVars`), or `useTheme()` directly.
 * - Even one-off colors live here as tokens.
 * - Monochrome only: pure black / pure white plus neutral grays for hierarchy.
 */

export type ThemeMode = 'dark' | 'light'

export interface ThemePalette {
    /** Page background (pure black / pure white). */
    bg: string
    /** Solid card & panel surface. */
    surface: string
    /** Primary text. */
    fg: string
    /** Secondary text. */
    muted: string
    /** Tertiary text, indexes, footers. */
    faint: string
    /** Hairline borders. */
    border: string
    /** Text sitting on a foreground-colored surface (inverted pill). */
    onFg: string
    /** Muted text sitting on a foreground-colored surface. */
    onFgMuted: string
    /** Moving-gradient glow layers (monochrome only). */
    glowSoft: string
    glowMid: string
    /** Moving-gradient solid tint stops. */
    gradientTint: string
    gradientTintDeep: string
    /** Film-grain strength over the moving gradient (0–1). Light shows dark speckle more strongly, so it's dialed down. */
    noiseOpacity: number
    /** Grain tile size in px — bigger = larger (and slightly softer) specks. Dark keeps the SVG's native 160px; light stretches up for visibility. */
    noiseSize: number
    /** Overlay veil behind floating panels (docs drawer). On the dark bg it barely registers — the drawer separates via surface + border — but it matters in light mode. */
    scrim: string
}

const palettes: Record<ThemeMode, ThemePalette> = {
    dark: {
        bg: '#000000',
        surface: '#0c0c0c',
        fg: '#ffffff',
        muted: '#9a9a9a',
        faint: '#4e4e4e',
        border: '#1f1f1f',
        onFg: '#000000',
        onFgMuted: 'rgba(0, 0, 0, 0.55)',
        glowSoft: 'rgba(255, 255, 255, 0.06)',
        glowMid: 'rgba(255, 255, 255, 0.10)',
        gradientTint: '#101010',
        gradientTintDeep: '#1c1c1c',
        noiseOpacity: 0.15,
        noiseSize: 160,
        scrim: 'rgba(0, 0, 0, 0.6)',
    },
    light: {
        bg: '#ffffff',
        surface: '#f7f7f7',
        fg: '#000000',
        muted: '#5a5a5a',
        faint: '#a3a3a3',
        border: '#e7e7e7',
        onFg: '#ffffff',
        onFgMuted: 'rgba(255, 255, 255, 0.55)',
        glowSoft: 'rgba(0, 0, 0, 0.15)',
        glowMid: 'rgba(0, 0, 0, 0.12)',
        gradientTint: '#f0f0f0',
        gradientTintDeep: '#e6e6e6',
        noiseOpacity: 0.12,
        noiseSize: 256,
        scrim: 'rgba(0, 0, 0, 0.32)',
    },
}

export function palette(mode: ThemeMode): ThemePalette {
    return palettes[mode]
}

/** Typography tokens — pixel for display, Inter for body/UI, mono for terminal accents. */
export const FONT_TOKENS = {
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    sans: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    pixel: '"Press Start 2P", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const

interface TokenToVar {
    name: string
    value: string
}

const cssVarNames: { [K in keyof ThemePalette]: string } = {
    bg: '--color-bg',
    surface: '--color-surface',
    fg: '--color-fg',
    muted: '--color-muted',
    faint: '--color-faint',
    border: '--color-border',
    onFg: '--color-on-fg',
    onFgMuted: '--color-on-fg-muted',
    glowSoft: '--gradient-glow-soft',
    glowMid: '--gradient-glow-mid',
    gradientTint: '--gradient-tint',
    gradientTintDeep: '--gradient-tint-deep',
    noiseOpacity: '--noise-opacity',
    noiseSize: '--noise-size',
    scrim: '--color-scrim',
}

const fontVarNames: { [K in keyof typeof FONT_TOKENS]: string } = {
    mono: '--font-mono',
    sans: '--font-sans',
    pixel: '--font-pixel',
}

/** Flattens the palette + font tokens into CSS custom properties. */
export function themeToCssVars(mode: ThemeMode): CSSProperties {
    const entries: TokenToVar[] = []

    for (const key of Object.keys(palette(mode)) as (keyof ThemePalette)[]) {
        entries.push({ name: cssVarNames[key], value: String(palette(mode)[key]) })
    }
    for (const key of Object.keys(FONT_TOKENS) as (keyof typeof FONT_TOKENS)[]) {
        entries.push({ name: fontVarNames[key], value: FONT_TOKENS[key] })
    }

    const vars: Record<string, string> = {}
    for (const { name, value } of entries) vars[name] = value
    return vars as CSSProperties
}
