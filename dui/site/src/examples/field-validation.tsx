import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field.tsx'
import { Input } from '../ui/input.tsx'

// Datastar checks the value as it's typed, marks the field invalid, and fills in the error.
export default () => (
  <Field
    style="max-width: 24rem"
    data-signals="{email: 'not-an-email'}"
    data-computed:email-error="$email.includes('@') ? '' : 'Enter an email address, like m@example.com.'"
    data-attr:data-invalid="String(!!$emailError)"
    data-invalid="true"
  >
    <FieldLabel for="field-email">Email</FieldLabel>
    <Input
      id="field-email"
      type="email"
      data-bind:email
      data-attr:aria-invalid="String(!!$emailError)"
      aria-invalid="true"
    />
    <FieldDescription>We'll send your receipt here.</FieldDescription>
    <FieldError data-text="$emailError">Enter an email address, like m@example.com.</FieldError>
  </Field>
)
