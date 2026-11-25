import { Field, FieldDescription, FieldLabel } from '../ui/field.tsx'
import { Input } from '../ui/input.tsx'

export default () => (
  <Field style="max-width: 24rem">
    <FieldLabel for="username">Username</FieldLabel>
    <Input id="username" name="username" placeholder="evilrabbit" />
    <FieldDescription>Choose a unique username for your account.</FieldDescription>
  </Field>
)
