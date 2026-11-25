// A small label, like a status. It's a link that looks like one when it has an href.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './badge.css' with { type: 'text' }

export const BADGE_CSS = css

export function Badge(
  props: Record<string, unknown> & {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | undefined
    href?: string | undefined
    children?: Child
  },
): Html {
  let { variant = 'default', href, children, ...attributes } = props
  let slot = { 'data-slot': 'badge', 'data-variant': variant }
  if (href !== undefined) {
    return (
      <a href={href} {...slot} {...attributes}>
        {children}
      </a>
    )
  }
  return (
    <span {...slot} {...attributes}>
      {children}
    </span>
  )
}
