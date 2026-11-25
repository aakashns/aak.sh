import { Field, FieldContent, FieldDescription, FieldLabel } from '../ui/field.tsx'
import { Switch } from '../ui/switch.tsx'

export default () => (
  <Field orientation="horizontal" style="max-width: 24rem">
    <FieldContent>
      <FieldLabel for="marketing">Marketing emails</FieldLabel>
      <FieldDescription>Receive emails about new products and features.</FieldDescription>
    </FieldContent>
    <Switch id="marketing" name="marketing" checked />
  </Field>
)
