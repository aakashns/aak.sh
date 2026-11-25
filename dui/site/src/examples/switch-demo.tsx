import { Label } from '../ui/label.tsx'
import { Switch } from '../ui/switch.tsx'

export default () => (
  <div style="display: flex; align-items: center; gap: 0.5rem">
    <Switch id="airplane-mode" />
    <Label for="airplane-mode">Airplane mode</Label>
  </div>
)
