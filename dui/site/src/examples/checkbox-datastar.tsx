import { Button } from '../ui/button.tsx'
import { Checkbox } from '../ui/checkbox.tsx'
import { Label } from '../ui/label.tsx'

// data-bind keeps the box and the $agreed signal in step.
export default () => (
  <div data-signals:agreed="false" style="display: grid; gap: 1rem; justify-items: start">
    <Label>
      <Checkbox data-bind:agreed /> I've read the terms
    </Label>
    <Button data-attr:disabled="!$agreed" disabled>
      Continue
    </Button>
  </div>
)
