// A card and its parts. CardTitle is a <div>; give it `as="h2"` (or h3) where it starts a section.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './card.css' with { type: 'text' }

export const CARD_CSS = css

type Props = Record<string, unknown> & { children?: Child }

const part = (slot: string) => (props: Props) => {
  let { children, ...attributes } = props
  return (
    <div data-slot={slot} {...attributes}>
      {children}
    </div>
  )
}

export const Card = part('card')
export const CardHeader = part('card-header')
export const CardDescription = part('card-description')
export const CardContent = part('card-content')
export const CardFooter = part('card-footer')

export function CardTitle(props: Props & { as?: 'div' | 'h2' | 'h3' | 'h4' | undefined }): Html {
  let { as: Tag = 'div', children, ...attributes } = props
  return (
    <Tag data-slot="card-title" {...attributes}>
      {children}
    </Tag>
  )
}
