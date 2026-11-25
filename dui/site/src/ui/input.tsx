// An <input> whose attributes go on it as they are, like Datastar's `data-bind`.
import type { Html } from '../lib/jsx/jsx-runtime.ts'
import css from './input.css' with { type: 'text' }

export const INPUT_CSS = css

export function Input(props: Record<string, unknown>): Html {
  return <input data-slot="input" {...props} />
}
