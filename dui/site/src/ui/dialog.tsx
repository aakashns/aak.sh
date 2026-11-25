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

// The dialog, with its title and description in a header, and an × in the corner that closes
// it (leave it out with `showCloseButton={false}`).
export function Dialog(
  props: Record<string, unknown> & {
    id: string
    title: Child
    description?: Child
    showCloseButton?: boolean | undefined
    children?: Child
  },
): Html {
  let { id, title, description, showCloseButton = true, children, ...attributes } = props
  return (
    <dialog
      id={id}
      closedby="any"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      data-slot="dialog"
      {...attributes}
    >
      <div data-slot="dialog-header">
        <h2 id={`${id}-title`} data-slot="dialog-title">
          {title}
        </h2>
        {description ? (
          <p id={`${id}-description`} data-slot="dialog-description">
            {description}
          </p>
        ) : null}
      </div>
      {children}
      {showCloseButton ? (
        <button
          type="button"
          command="close"
          commandfor={id}
          aria-label="Close"
          data-slot="dialog-close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      ) : null}
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
