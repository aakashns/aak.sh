// A native <progress>, out of 100 unless it's given a `max`. Leave out `value` for one that's
// indeterminate, or bind it with Datastar's `data-attr:value`.
import type { Html } from '../lib/jsx/jsx-runtime.ts'
import css from './progress.css' with { type: 'text' }

export const PROGRESS_CSS = css

export function Progress(props: Record<string, unknown>): Html {
  return <progress max="100" data-slot="progress" {...props}></progress>
}
