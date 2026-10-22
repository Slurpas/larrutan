import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './RoundButton.module.css'

interface RoundButtonProps {
  /** Spoken by screen readers and used by tests; the child sees only the icon. */
  label: string
  onClick: () => void
  size?: 'normal' | 'large'
  children: ReactNode
}

/** A big round icon button with the same push-down feel as the Spela button. */
export function RoundButton({ label, onClick, size = 'normal', children }: RoundButtonProps) {
  return (
    <button
      type="button"
      className={cx(styles.button, size === 'large' && styles.large)}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
