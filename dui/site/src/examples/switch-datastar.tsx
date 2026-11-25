import { Label } from '../ui/label.tsx'
import { Switch } from '../ui/switch.tsx'

export default () => (
  <Label data-signals:airplane="false">
    <Switch data-bind:airplane />
    Airplane mode is <span data-text="$airplane ? 'on' : 'off'">off</span>
  </Label>
)
