// A line between things. It's only decoration, hidden from assistive technology, unless it's
// given `decorative={false}`.
import type { Html } from '../lib/jsx/jsx-runtime.ts'
import css from './separator.css' with { type: 'text' }

export const SEPARATOR_CSS = css

export function Separator(
  props: Record<string, unknown> & {
    orientation?: 'horizontal' | 'vertical' | undefined
    decorative?: boolean | undefined
  },
): Html {
  let { orientation = 'horizontal', decorative = true, ...attributes } = props
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative || orientation === 'horizontal' ? undefined : orientation}
      data-slot="separator"
      data-orientation={orientation}
      {...attributes}
    ></div>
  )
}
