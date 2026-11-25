// A <textarea> that grows with its text. Its `value` is what's in it; other attributes go on it
// as they are, like Datastar's `data-bind`.
import type { Html } from '../lib/jsx/jsx-runtime.ts'
import css from './textarea.css' with { type: 'text' }

export const TEXTAREA_CSS = css

export function Textarea(props: Record<string, unknown> & { value?: string | undefined }): Html {
  let { value, ...attributes } = props
  return (
    <textarea data-slot="textarea" {...attributes}>
      {value}
    </textarea>
  )
}
