import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '../ui/field.tsx'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.tsx'

// A label around a whole field makes a card to pick, highlighted while it's checked.
export default () => (
  <RadioGroup style="width: 100%; max-width: 24rem">
    <FieldLabel>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Kubernetes</FieldTitle>
          <FieldDescription>Run GPU workloads on a K8s cluster.</FieldDescription>
        </FieldContent>
        <RadioGroupItem name="compute" value="kubernetes" checked />
      </Field>
    </FieldLabel>
    <FieldLabel>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Virtual machine</FieldTitle>
          <FieldDescription>Access a cluster to run GPU workloads.</FieldDescription>
        </FieldContent>
        <RadioGroupItem name="compute" value="vm" />
      </Field>
    </FieldLabel>
  </RadioGroup>
)
