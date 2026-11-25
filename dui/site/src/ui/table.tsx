// A <table> and its parts, in a box that scrolls sideways when it's wider than the screen.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './table.css' with { type: 'text' }

export const TABLE_CSS = css

type Props = Record<string, unknown> & { children?: Child }

export function Table(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <div data-slot="table-container">
      <table data-slot="table" {...attributes}>
        {children}
      </table>
    </div>
  )
}

const part = (tag: string, slot: string) => (props: Props) => {
  let { children, ...attributes } = props
  let Tag = tag
  return (
    <Tag data-slot={slot} {...attributes}>
      {children}
    </Tag>
  )
}

export const TableHeader = part('thead', 'table-header')
export const TableBody = part('tbody', 'table-body')
export const TableFooter = part('tfoot', 'table-footer')
export const TableRow = part('tr', 'table-row')
export const TableHead = part('th', 'table-head')
export const TableCell = part('td', 'table-cell')
export const TableCaption = part('caption', 'table-caption')
