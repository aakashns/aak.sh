// A <label>. Point it at its control with `for`, or put the control inside it.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './label.css' with { type: 'text' }

export const LABEL_CSS = css

export function Label(props: Record<string, unknown> & { children?: Child }): Html {
  let { children, ...attributes } = props
  return (
    <label data-slot="label" {...attributes}>
      {children}
    </label>
  )
}
