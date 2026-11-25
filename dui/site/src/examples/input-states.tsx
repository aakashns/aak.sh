import { Input } from '../ui/input.tsx'

export default () => (
  <div style="display: grid; gap: 0.75rem; width: 100%; max-width: 20rem">
    <Input placeholder="Disabled" aria-label="Disabled" disabled />
    <Input value="not an email" aria-label="Email" aria-invalid="true" />
  </div>
)
