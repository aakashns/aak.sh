// A native <select> with a chevron: the phone's own picker, sent with its form, and no
// JavaScript. Its attributes go on the <select>, like `name` or Datastar's `data-bind`.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './native-select.css' with { type: 'text' }

export const NATIVE_SELECT_CSS = css

export function NativeSelect(
  props: Record<string, unknown> & { size?: 'default' | 'sm' | undefined; children?: Child },
): Html {
  let { size = 'default', children, ...attributes } = props
  return (
    <div data-slot="native-select-wrapper">
      <select data-slot="native-select" data-size={size} {...attributes}>
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        data-slot="native-select-icon"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}

export function NativeSelectOption(props: Record<string, unknown> & { children?: Child }): Html {
  let { children, ...attributes } = props
  return (
    <option data-slot="native-select-option" {...attributes}>
      {children}
    </option>
  )
}

export function NativeSelectOptGroup(props: Record<string, unknown> & { children?: Child }): Html {
  let { children, ...attributes } = props
  return (
    <optgroup data-slot="native-select-optgroup" {...attributes}>
      {children}
    </optgroup>
  )
}
