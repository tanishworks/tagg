import { useEffect, useState } from 'react'
import { FONT_TOKENS } from '../theme/theme'

/**
 * Gate for ascii-reveal content.
 *
 * ascii-reveal takes ONE layout measurement when a reveal starts. If webfonts
 * land after that (Google Fonts, display=swap), the scramble draws in the
 * fallback face and text visibly swaps mid-animation. So we resolve only when
 * every family/weight used at first paint is actually loaded.
 *
 * Sequence:
 * 1. Wait for the Google Fonts stylesheet (`fonts.ready` alone can resolve
 *    before a still-loading stylesheet registers its @font-face rules).
 * 2. Explicitly load each family/weight (weights change layout metrics, so
 *    loading only 400 is not enough).
 * 3. `document.fonts.ready`.
 *
 * The whole wait is capped by FALLBACK_TIMEOUT_MS so a blocked font CDN can
 * never leave the site blank permanently — the fallback font is then shown.
 */

const STYLESHEET_SELECTOR = 'link[href*="fonts.googleapis.com"]'
const FALLBACK_TIMEOUT_MS = 3500

/** Family names are derived from FONT_TOKENS — the single source of truth. */
const weightsByFamily = new Map<string, number[]>([
  [firstFontFamily(FONT_TOKENS.sans), [400, 500, 600, 700]],
  [firstFontFamily(FONT_TOKENS.mono), [400, 500, 700]],
  [firstFontFamily(FONT_TOKENS.pixel), [400]],
])

function firstFontFamily(token: string): string {
  const quoted = token.match(/"([^"]+)"/)
  return quoted ? quoted[1] : token.split(',')[0].trim()
}

interface FontFaceSetLike {
  ready: Promise<unknown>
  load: (font: string) => Promise<FontFace[]>
}

function getFontFaceSet(): FontFaceSetLike | null {
  return (document as Document & { fonts?: FontFaceSetLike }).fonts ?? null
}

/** Resolves when `promise` settles, or after `ms` — whichever comes first. */
function withTimeout(promise: Promise<unknown>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    promise.then(
      () => {
        clearTimeout(timer)
        resolve()
      },
      () => {
        clearTimeout(timer)
        resolve()
      },
    )
  })
}

async function waitForFonts(): Promise<void> {
  await withTimeout(
    (async () => {
      const fonts = getFontFaceSet()
      if (!fonts) return

      const stylesheet = document.querySelector<HTMLLinkElement>(STYLESHEET_SELECTOR)
      if (stylesheet && !stylesheet.sheet) {
        await new Promise<void>((resolve) => {
          stylesheet.addEventListener('load', () => resolve(), { once: true })
          stylesheet.addEventListener('error', () => resolve(), { once: true })
        })
      }

      await Promise.all(
        [...weightsByFamily.entries()].flatMap(([family, weights]) =>
          weights.map((weight) => fonts.load(`${weight} 1em "${family}"`).catch(() => [])),
        ),
      )
      await fonts.ready
    })(),
    FALLBACK_TIMEOUT_MS,
  )
}

export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void waitForFonts().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return ready
}
