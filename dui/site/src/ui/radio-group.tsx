// Native radio buttons in a group: give each item the same `name`, and the browser lets one be
// checked, moves between them with the arrow keys, and sends the checked one's value with the form.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './radio-group.css' with { type: 'text' }

export const RADIO_GROUP_CSS = css

export function RadioGroup(props: Record<string, unknown> & { children?: Child }): Html {
  let { children, ...attributes } = props
  return (
    <div role="radiogroup" data-slot="radio-group" {...attributes}>
      {children}
    </div>
  )
}

export function RadioGroupItem(props: Record<string, unknown>): Html {
  return <input type="radio" data-slot="radio-group-item" {...props} />
}
