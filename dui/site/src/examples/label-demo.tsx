import { Checkbox } from '../ui/checkbox.tsx'
import { Label } from '../ui/label.tsx'

export default () => (
  <div style="display: flex; align-items: center; gap: 0.5rem">
    <Checkbox id="label-terms" />
    <Label for="label-terms">Accept terms and conditions</Label>
  </div>
)
