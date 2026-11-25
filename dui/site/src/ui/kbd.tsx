// A key, or keys pressed together, like ⌘ K.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './kbd.css' with { type: 'text' }

export const KBD_CSS = css

type Props = Record<string, unknown> & { children?: Child }

export function Kbd(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <kbd data-slot="kbd" {...attributes}>
      {children}
    </kbd>
  )
}

export function KbdGroup(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <kbd data-slot="kbd-group" {...attributes}>
      {children}
    </kbd>
  )
}
