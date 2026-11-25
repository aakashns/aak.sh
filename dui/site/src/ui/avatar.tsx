// A round picture of someone, over a fallback like their initials. The fallback shows while the
// image loads, or if it doesn't.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './avatar.css' with { type: 'text' }

export const AVATAR_CSS = css

type Props = Record<string, unknown> & { children?: Child }

export function Avatar(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <span data-slot="avatar" {...attributes}>
      {children}
    </span>
  )
}

// Give it an `alt`, or `alt=""` with the fallback saying who it is.
export function AvatarImage(props: Record<string, unknown>): Html {
  return <img data-slot="avatar-image" {...props} />
}

export function AvatarFallback(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <span data-slot="avatar-fallback" {...attributes}>
      {children}
    </span>
  )
}
