import { Dialog, DialogClose, DialogFooter, DialogTrigger } from '../ui/dialog.tsx'
import { Input } from '../ui/input.tsx'
import { Label } from '../ui/label.tsx'

export default () => (
  <>
    <DialogTrigger dialog="edit-profile" variant="outline">
      Edit profile
    </DialogTrigger>
    <Dialog
      id="edit-profile"
      title="Edit profile"
      description="Make changes to your profile here. Save when you're done."
    >
      <form method="dialog" id="edit-profile-form" style="display: grid; gap: 1rem">
        <div style="display: grid; gap: 0.75rem">
          <Label for="profile-name">Name</Label>
          <Input id="profile-name" name="name" value="Pedro Duarte" />
        </div>
        <div style="display: grid; gap: 0.75rem">
          <Label for="profile-username">Username</Label>
          <Input id="profile-username" name="username" value="@peduarte" />
        </div>
      </form>
      <DialogFooter>
        <DialogClose dialog="edit-profile" variant="outline">
          Cancel
        </DialogClose>
        <DialogClose dialog="edit-profile" type="submit" form="edit-profile-form">
          Save changes
        </DialogClose>
      </DialogFooter>
    </Dialog>
  </>
)
