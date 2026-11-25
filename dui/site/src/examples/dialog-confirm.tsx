import { Dialog, DialogClose, DialogFooter, DialogTrigger } from '../ui/dialog.tsx'

// No × in the corner: the reader has to pick one.
export default () => (
  <>
    <DialogTrigger dialog="delete-account" variant="destructive">
      Delete account
    </DialogTrigger>
    <Dialog
      id="delete-account"
      title="Are you absolutely sure?"
      description="This can't be undone. It deletes your account and your data from our servers."
      showCloseButton={false}
    >
      <DialogFooter>
        <DialogClose dialog="delete-account" variant="outline">
          Cancel
        </DialogClose>
        <DialogClose dialog="delete-account" variant="destructive">
          Delete
        </DialogClose>
      </DialogFooter>
    </Dialog>
  </>
)
