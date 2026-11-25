import { Dialog, DialogClose, DialogFooter, DialogTrigger } from '../ui/dialog.tsx'
import { Input } from '../ui/input.tsx'

// The dialog edits a signal, and Save copies it over the one the page shows.
export default () => (
  <div
    data-signals="{file: 'notes.txt', draft: 'notes.txt'}"
    style="display: grid; gap: 1rem; justify-items: center"
  >
    <p style="margin: 0">
      File: <code data-text="$file">notes.txt</code>
    </p>
    <DialogTrigger dialog="rename" variant="outline" data-on:click="$draft = $file">
      Rename
    </DialogTrigger>
    <Dialog id="rename" title="Rename file" description="Pick a new name for this file.">
      <Input aria-label="Name" data-bind:draft />
      <DialogFooter>
        <DialogClose dialog="rename" variant="outline">
          Cancel
        </DialogClose>
        <DialogClose dialog="rename" data-on:click="$file = $draft">
          Save
        </DialogClose>
      </DialogFooter>
    </Dialog>
  </div>
)
