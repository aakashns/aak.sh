import { Button } from '../ui/button.tsx'
import { Checkbox } from '../ui/checkbox.tsx'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '../ui/field.tsx'
import { Input } from '../ui/input.tsx'
import { NativeSelect, NativeSelectOption } from '../ui/native-select.tsx'
import { Textarea } from '../ui/textarea.tsx'

// Datastar handles the submit, from Save or Enter, in place of the form's own: post it to your
// server with @post. method="post" keeps the values out of the URL if Datastar isn't running.
export default () => (
  <form
    method="post"
    style="width: 100%; max-width: 28rem"
    data-signals="{projectName: 'Acme dashboard', saved: ''}"
    data-on:submit="$saved = $projectName"
    data-on:reset="$saved = ''; $projectName = 'Acme dashboard'"
  >
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Project</FieldLegend>
        <FieldDescription>How the project appears to your team.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel for="project-name">Name</FieldLabel>
            <Input
              id="project-name"
              name="name"
              value="Acme dashboard"
              required
              data-bind:project-name
            />
          </Field>
          <Field>
            <FieldLabel for="project-region">Region</FieldLabel>
            <NativeSelect id="project-region" name="region" style="width: 100%">
              <NativeSelectOption value="us-east">US East</NativeSelectOption>
              <NativeSelectOption value="eu-west">EU West</NativeSelectOption>
              <NativeSelectOption value="ap-south">Asia Pacific South</NativeSelectOption>
            </NativeSelect>
            <FieldDescription>Where its data is stored.</FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend>Notifications</FieldLegend>
        <Field orientation="horizontal">
          <Checkbox id="project-alerts" name="alerts" checked />
          <FieldLabel for="project-alerts" style="font-weight: 400">
            Email me when a deploy fails
          </FieldLabel>
        </Field>
      </FieldSet>
      <Field>
        <FieldLabel for="project-notes">Notes</FieldLabel>
        <Textarea id="project-notes" name="notes" placeholder="Anything your team should know" />
      </Field>
      <Field orientation="horizontal">
        <Button type="submit">Save</Button>
        <Button type="reset" variant="outline">
          Reset
        </Button>
        <p
          role="status"
          data-text="$saved && 'Saved ' + $saved + '.'"
          style="margin: 0; font-size: 0.875rem"
        ></p>
      </Field>
    </FieldGroup>
  </form>
)
