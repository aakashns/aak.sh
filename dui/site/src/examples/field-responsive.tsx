import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '../ui/field.tsx'
import { Input } from '../ui/input.tsx'
import { Textarea } from '../ui/textarea.tsx'

// Side by side when the group is wide enough, stacked when it isn't.
export default () => (
  <FieldGroup style="max-width: 36rem">
    <Field orientation="responsive">
      <FieldContent>
        <FieldLabel for="resp-name">Name</FieldLabel>
        <FieldDescription>Shown on your profile.</FieldDescription>
      </FieldContent>
      <Input id="resp-name" placeholder="Evil Rabbit" style="max-width: 16rem" />
    </Field>
    <Field orientation="responsive">
      <FieldContent>
        <FieldLabel for="resp-bio">Bio</FieldLabel>
        <FieldDescription>A sentence or two about you.</FieldDescription>
      </FieldContent>
      <Textarea id="resp-bio" style="max-width: 16rem" />
    </Field>
  </FieldGroup>
)
