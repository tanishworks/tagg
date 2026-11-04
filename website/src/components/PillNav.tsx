import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Route } from '../lib/useHashRoute'

interface PillNavItem {
  label: string
  route: Route
}

interface PillNavProps {
  items: readonly PillNavItem[]
  active: Route
  onChange: (route: Route) => void
}

interface IndicatorBox {
  left: number
  width: number
}

/**
 * Pill navigation with a sliding active indicator.
 *
 * The indicator is absolutely positioned inside the pill and animated with
 * transform + width, so the browser can composite it without re-layout.
 * Tab positions are measured from the DOM (offsetLeft/offsetWidth) on:
 * - active tab change,
 * - window resize,
 * - font load completion (pixel/mono font swaps shift text widths).
 */
export function PillNav({ items, active, onChange }: PillNavProps) {
  const navRef = useRef<HTMLElement>(null)
  const buttonRefs = useRef(new Map<Route, HTMLButtonElement | null>())
  const [indicator, setIndicator] = useState<IndicatorBox | null>(null)
  const [ready, setReady] = useState(false)

  const measure = useCallback(() => {
    const nav = navRef.current
    const tab = buttonRefs.current.get(active)
    if (!nav || !tab || nav.offsetParent === null) return
    setIndicator({ left: tab.offsetLeft, width: tab.offsetWidth })
  }, [active])

  // First measurement happens in the same tree the indicator mounts in, so we
  // mark it as settled one frame later — that keeps the very first appearance
  // from sliding in from the left edge.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    let cancelled = false
    void fonts?.ready.then(() => {
      if (!cancelled) measure()
    })
    return () => {
      cancelled = true
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  return (
    <nav ref={navRef} className="pill-nav" aria-label="Pages">
      {indicator && (
        <span
          className="pill-indicator"
          data-ready={ready}
          style={{ transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` }}
          aria-hidden="true"
        />
      )}
      {items.map((item) => (
        <button
          key={item.route}
          type="button"
          ref={(el) => {
            buttonRefs.current.set(item.route, el)
          }}
          className="pill-tab"
          data-active={item.route === active ? '' : undefined}
          onClick={() => onChange(item.route)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
