import { useTheme } from '../theme/ThemeProvider'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

function strokeDefaults(size: number): IconProps {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
}

export function SunIcon({ size = 16 }: IconProps) {
  return (
    <svg {...strokeDefaults(size)}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

export function MoonIcon({ size = 16 }: IconProps) {
  return (
    <svg {...strokeDefaults(size)}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme()
  const next: string = mode === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${next} mode`
  const Icon = mode === 'dark' ? SunIcon : MoonIcon
  return (
    <button type="button" className="icon-button" onClick={toggleMode} aria-label={label} title={label}>
      <Icon />
    </button>
  )
}
