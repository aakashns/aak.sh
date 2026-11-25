import { Field, FieldError, FieldLabel } from '../ui/field.tsx'
import { Input } from '../ui/input.tsx'

// Errors from the server, rendered with the page.
export default () => (
  <Field data-invalid="true" style="max-width: 24rem">
    <FieldLabel for="new-password">Password</FieldLabel>
    <Input id="new-password" type="password" value="hunter2" aria-invalid="true" />
    <FieldError errors={['Use at least 12 characters.', 'Add a number or a symbol.']} />
  </Field>
)
