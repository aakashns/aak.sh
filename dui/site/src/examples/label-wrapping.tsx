import { Label } from '../ui/label.tsx'
import { Switch } from '../ui/switch.tsx'

// A label around its control needs no id, and looks disabled when the control is.
export default () => (
  <div style="display: grid; gap: 1rem">
    <Label>
      <Switch /> Wi-Fi
    </Label>
    <Label>
      <Switch disabled /> Bluetooth
    </Label>
  </div>
)
