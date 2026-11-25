import { Checkbox } from '../ui/checkbox.tsx'
import { Field, FieldContent, FieldDescription, FieldLabel } from '../ui/field.tsx'

export default () => (
  <Field orientation="horizontal" style="max-width: 24rem">
    <Checkbox id="terms-2" name="terms" checked />
    <FieldContent>
      <FieldLabel for="terms-2">Accept terms and conditions</FieldLabel>
      <FieldDescription>By checking this, you agree to the terms of service.</FieldDescription>
    </FieldContent>
  </Field>
)
