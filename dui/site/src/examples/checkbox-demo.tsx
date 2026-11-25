import { Checkbox } from '../ui/checkbox.tsx'
import { Label } from '../ui/label.tsx'

export default () => (
  <div style="display: grid; gap: 1.5rem">
    <div style="display: flex; align-items: center; gap: 0.75rem">
      <Checkbox id="terms" />
      <Label for="terms">Accept terms and conditions</Label>
    </div>
    <div style="display: flex; align-items: center; gap: 0.75rem">
      <Checkbox id="newsletter" checked />
      <Label for="newsletter">Subscribe to the newsletter</Label>
    </div>
    <div style="display: flex; align-items: center; gap: 0.75rem">
      <Checkbox id="disabled" disabled />
      <Label for="disabled">Enable notifications</Label>
    </div>
  </div>
)
