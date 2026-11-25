import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '../ui/field.tsx'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.tsx'

const OPTIONS = [
  ['kubernetes', 'Kubernetes', 'Run GPU workloads on a K8s cluster.'],
  ['vm', 'Virtual machine', 'Access a cluster to run GPU workloads.'],
]

// A label around a whole field makes a card to pick, highlighted while it's checked. Each radio
// is named by its title and described by its description, rather than by all the card's text.
export default () => (
  <RadioGroup aria-label="Compute" style="width: 100%; max-width: 24rem">
    {OPTIONS.map(([value, title, description]) => (
      <FieldLabel>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle id={`compute-${value}-title`}>{title}</FieldTitle>
            <FieldDescription id={`compute-${value}-description`}>{description}</FieldDescription>
          </FieldContent>
          <RadioGroupItem
            name="compute"
            value={value}
            checked={value === 'kubernetes'}
            aria-labelledby={`compute-${value}-title`}
            aria-describedby={`compute-${value}-description`}
          />
        </Field>
      </FieldLabel>
    ))}
  </RadioGroup>
)
