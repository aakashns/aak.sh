// A native <dialog> that needs no JavaScript: its trigger opens it as a modal with
// `command="show-modal"`, and the browser traps focus, closes it on Escape (or, with
// `closedby="any"`, a click outside), and gives focus back to the trigger.
//
//   <DialogTrigger dialog="rename">Rename</DialogTrigger>
//   <Dialog id="rename" title="Rename" description="…">… <DialogFooter>…</DialogFooter></Dialog>
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import { Button, type ButtonProps } from './button.tsx'
import css from './dialog.css' with { type: 'text' }

export const DIALOG_CSS = css

// A Button that opens the dialog with this id.
export function DialogTrigger(props: ButtonProps & { dialog: string }): Html {
  let { dialog, ...button } = props
  return <Button command="show-modal" commandfor={dialog} aria-haspopup="dialog" {...button} />
}

// A Button that closes the dialog with this id, like a footer's Cancel.
export function DialogClose(props: ButtonProps & { dialog: string }): Html {
  let { dialog, ...button } = props
  return <Button command="close" commandfor={dialog} {...button} />
}

export function Dialog(
  props: Record<string, unknown> & {
    id: string
    title: Child
    description?: Child
    children?: Child
  },
): Html {
  let { id, title, description, children, ...attributes } = props
  return (
    <dialog
      id={id}
      closedby="any"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      data-slot="dialog"
      {...attributes}
    >
      <h2 id={`${id}-title`} data-slot="dialog-title">
        {title}
      </h2>
      {description ? (
        <p id={`${id}-description`} data-slot="dialog-description">
          {description}
        </p>
      ) : null}
      {children}
    </dialog>
  )
}

export function DialogFooter(props: Record<string, unknown> & { children?: Child }): Html {
  let { children, ...attributes } = props
  return (
    <div data-slot="dialog-footer" {...attributes}>
      {children}
    </div>
  )
}
