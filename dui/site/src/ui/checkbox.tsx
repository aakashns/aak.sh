// A native checkbox: it's sent with its form and works without JavaScript. Its attributes go on
// the <input>, like `checked` or Datastar's `data-bind`.
import type { Html } from '../lib/jsx/jsx-runtime.ts'
import css from './checkbox.css' with { type: 'text' }

export const CHECKBOX_CSS = css

export function Checkbox(props: Record<string, unknown>): Html {
  return <input type="checkbox" data-slot="checkbox" {...props} />
}
