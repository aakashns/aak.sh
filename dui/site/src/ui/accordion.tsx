// Sections that open and close, on native <details>: no JavaScript, and find-in-page opens the
// section it finds text in. Give the items one `name` for an accordion where one opens at a time,
// and an item `open` to start open.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './accordion.css' with { type: 'text' }

export const ACCORDION_CSS = css

type Props = Record<string, unknown> & { children?: Child }

export function Accordion(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <div data-slot="accordion" {...attributes}>
      {children}
    </div>
  )
}

export function AccordionItem(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <details data-slot="accordion-item" {...attributes}>
      {children}
    </details>
  )
}

export function AccordionTrigger(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <summary data-slot="accordion-trigger" {...attributes}>
      {children}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </summary>
  )
}

export function AccordionContent(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <div data-slot="accordion-content" {...attributes}>
      {children}
    </div>
  )
}
