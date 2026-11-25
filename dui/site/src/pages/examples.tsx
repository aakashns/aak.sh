// Each component's live preview on its docs page, and the code for it. The previews use Datastar
// to show the components' attributes reaching the element.
import type { Html } from '../lib/jsx/jsx-runtime.ts'
import { Button } from '../ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card.tsx'
import { Dialog, DialogClose, DialogFooter, DialogTrigger } from '../ui/dialog.tsx'
import { Input } from '../ui/input.tsx'
import { Switch } from '../ui/switch.tsx'

export const examples: Record<string, { preview: () => Html; code: string }> = {
  button: {
    preview: () => (
      <div class="row" data-signals:count="0">
        <Button data-on:click="$count++">
          Clicked <span data-text="$count">0</span> times
        </Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link" href="/docs">
          Link
        </Button>
      </div>
    ),
    code: `import { Button } from './ui/button.tsx'

<div data-signals:count="0">
  <Button data-on:click="$count++">
    Clicked <span data-text="$count">0</span> times
  </Button>
  <Button variant="outline">Outline</Button>
  <Button variant="link" href="/docs">Link</Button>
</div>`,
  },
  card: {
    preview: () => (
      <Card style="width: 100%; max-width: 22rem">
        <CardHeader>
          <CardTitle>Ship it</CardTitle>
          <CardDescription>Deploy your app in one click.</CardDescription>
        </CardHeader>
        <CardContent>Server-rendered HTML, styled with plain CSS.</CardContent>
        <CardFooter>
          <Button>Deploy</Button>
          <Button variant="outline">Cancel</Button>
        </CardFooter>
      </Card>
    ),
    code: `import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card.tsx'

<Card>
  <CardHeader>
    <CardTitle>Ship it</CardTitle>
    <CardDescription>Deploy your app in one click.</CardDescription>
  </CardHeader>
  <CardContent>Server-rendered HTML, styled with plain CSS.</CardContent>
  <CardFooter>
    <Button>Deploy</Button>
  </CardFooter>
</Card>`,
  },
  dialog: {
    preview: () => (
      <>
        <DialogTrigger dialog="rename" variant="outline">
          Rename
        </DialogTrigger>
        <Dialog id="rename" title="Rename file" description="Pick a new name for this file.">
          <Input value="notes.txt" aria-label="Name" />
          <DialogFooter>
            <DialogClose dialog="rename" variant="outline">
              Cancel
            </DialogClose>
            <DialogClose dialog="rename">Save</DialogClose>
          </DialogFooter>
        </Dialog>
      </>
    ),
    code: `import { Dialog, DialogClose, DialogFooter, DialogTrigger } from './ui/dialog.tsx'

<DialogTrigger dialog="rename" variant="outline">Rename</DialogTrigger>
<Dialog id="rename" title="Rename file" description="Pick a new name for this file.">
  <Input value="notes.txt" aria-label="Name" />
  <DialogFooter>
    <DialogClose dialog="rename" variant="outline">Cancel</DialogClose>
    <DialogClose dialog="rename">Save</DialogClose>
  </DialogFooter>
</Dialog>`,
  },
  input: {
    preview: () => (
      <div class="stack" data-signals:name="''">
        <Input placeholder="Your name" aria-label="Name" data-bind:name />
        <p>
          Hello, <span data-text="$name || 'stranger'">stranger</span>!
        </p>
      </div>
    ),
    code: `import { Input } from './ui/input.tsx'

<div data-signals:name="''">
  <Input placeholder="Your name" aria-label="Name" data-bind:name />
  <p>Hello, <span data-text="$name || 'stranger'">stranger</span>!</p>
</div>`,
  },
  switch: {
    preview: () => (
      <label class="row" data-signals:airplane="false">
        <Switch data-bind:airplane />
        Airplane mode is <span data-text="$airplane ? 'on' : 'off'">off</span>
      </label>
    ),
    code: `import { Switch } from './ui/switch.tsx'

<label data-signals:airplane="false">
  <Switch data-bind:airplane />
  Airplane mode is <span data-text="$airplane ? 'on' : 'off'">off</span>
</label>`,
  },
}
