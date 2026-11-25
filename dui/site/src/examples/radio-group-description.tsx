import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../ui/field.tsx'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.tsx'

export default () => (
  <FieldSet style="max-width: 24rem">
    <FieldLegend variant="label">Subscription plan</FieldLegend>
    <RadioGroup>
      <Field orientation="horizontal">
        <RadioGroupItem id="plan-monthly" name="plan" value="monthly" checked />
        <FieldContent>
          <FieldLabel for="plan-monthly">Monthly ($9.99/month)</FieldLabel>
          <FieldDescription>Pay by the month. Cancel any time.</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem id="plan-yearly" name="plan" value="yearly" />
        <FieldContent>
          <FieldLabel for="plan-yearly">Yearly ($99.99/year)</FieldLabel>
          <FieldDescription>Save 17% by paying for the year.</FieldDescription>
        </FieldContent>
      </Field>
    </RadioGroup>
  </FieldSet>
)
