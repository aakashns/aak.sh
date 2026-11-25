import { Input } from '../ui/input.tsx'
import { Label } from '../ui/label.tsx'

export default () => (
  <div style="display: grid; gap: 0.75rem; width: 100%; max-width: 20rem">
    <Label for="input-email">Email</Label>
    <Input id="input-email" type="email" placeholder="Email" />
  </div>
)
