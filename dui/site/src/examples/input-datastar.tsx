import { Input } from '../ui/input.tsx'

// data-bind keeps the input and the $name signal in step.
export default () => (
  <div data-signals:name="''" style="display: grid; gap: 0.5rem; width: 100%; max-width: 20rem">
    <Input placeholder="Your name" aria-label="Name" data-bind:name />
    <p style="margin: 0">
      Hello, <span data-text="$name || 'stranger'">stranger</span>!
    </p>
  </div>
)
