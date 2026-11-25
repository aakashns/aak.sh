// A <button>, or a link that looks like one when it has an href. Other attributes go on the
// element as they are, like `type` or Datastar's `data-on:click`.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './button.css' with { type: 'text' }

export const BUTTON_CSS = css

export type ButtonProps = Record<string, unknown> & {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link' | undefined
  size?: 'default' | 'sm' | 'lg' | 'icon' | undefined
  href?: string | undefined
  children?: Child
}

export function Button(props: ButtonProps): Html {
  let { variant = 'default', size = 'default', href, children, ...attributes } = props
  let slot = { 'data-slot': 'button', 'data-variant': variant, 'data-size': size }
  if (href !== undefined) {
    return (
      <a href={href} {...slot} {...attributes}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" {...slot} {...attributes}>
      {children}
    </button>
  )
}
