// A native checkbox with the switch role: it's sent with its form and works without JavaScript.
// Its attributes go on the <input>, like Datastar's `data-bind`.
import type { Html } from '../lib/jsx/jsx-runtime.ts'
import css from './switch.css' with { type: 'text' }

export const SWITCH_CSS = css

export function Switch(props: Record<string, unknown>): Html {
  return <input type="checkbox" role="switch" data-slot="switch" {...props} />
}
