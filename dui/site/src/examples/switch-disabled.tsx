import { Label } from '../ui/label.tsx'
import { Switch } from '../ui/switch.tsx'

export default () => (
  <div style="display: grid; gap: 1rem">
    <Label>
      <Switch checked disabled /> On, and disabled
    </Label>
    <Label>
      <Switch disabled /> Off, and disabled
    </Label>
  </div>
)
