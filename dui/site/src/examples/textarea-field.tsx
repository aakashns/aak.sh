import { Field, FieldDescription, FieldLabel } from '../ui/field.tsx'
import { Textarea } from '../ui/textarea.tsx'

export default () => (
  <Field style="max-width: 24rem">
    <FieldLabel for="feedback">Feedback</FieldLabel>
    <Textarea id="feedback" name="feedback" placeholder="Your feedback helps us improve." />
    <FieldDescription>Share your thoughts about our service.</FieldDescription>
  </Field>
)
