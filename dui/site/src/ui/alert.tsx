// A callout for something the reader should notice, with an optional icon, a title, and a
// description. The destructive variant is for errors.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './alert.css' with { type: 'text' }

export const ALERT_CSS = css

type Props = Record<string, unknown> & { children?: Child }

export function Alert(props: Props & { variant?: 'default' | 'destructive' | undefined }): Html {
  let { variant = 'default', children, ...attributes } = props
  return (
    <div role="alert" data-slot="alert" data-variant={variant} {...attributes}>
      {children}
    </div>
  )
}

export function AlertTitle(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <div data-slot="alert-title" {...attributes}>
      {children}
    </div>
  )
}

export function AlertDescription(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <div data-slot="alert-description" {...attributes}>
      {children}
    </div>
  )
}
