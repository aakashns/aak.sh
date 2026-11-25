// A pulsing placeholder for what's still loading. Size it with `style` or a class.
import type { Html } from '../lib/jsx/jsx-runtime.ts'
import css from './skeleton.css' with { type: 'text' }

export const SKELETON_CSS = css

export function Skeleton(props: Record<string, unknown>): Html {
  return <div data-slot="skeleton" {...props}></div>
}
