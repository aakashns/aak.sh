import { Label } from '../ui/label.tsx'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.tsx'

// Radios bound to one signal set it to the checked one's value.
export default () => (
  <div data-signals:size="'m'" style="display: grid; gap: 1rem">
    <RadioGroup aria-label="Size" style="grid-auto-flow: column">
      {['s', 'm', 'l'].map((size) => (
        <Label>
          <RadioGroupItem name="size" value={size} data-bind:size checked={size === 'm'} />
          {size.toUpperCase()}
        </Label>
      ))}
    </RadioGroup>
    <p style="margin: 0">
      Size: <strong data-text="$size.toUpperCase()">M</strong>
    </p>
  </div>
)
