import { Input } from '../ui/input.tsx'
import { Label } from '../ui/label.tsx'

export default () => (
  <div style="display: grid; gap: 0.75rem; width: 100%; max-width: 20rem">
    <Label for="picture">Picture</Label>
    <Input id="picture" type="file" />
  </div>
)
