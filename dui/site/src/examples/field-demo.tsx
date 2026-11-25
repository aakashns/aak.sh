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

export default () => (
  <form style="width: 100%; max-width: 28rem">
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Payment method</FieldLegend>
        <FieldDescription>All transactions are secure and encrypted.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel for="card-name">Name on card</FieldLabel>
            <Input id="card-name" name="name" placeholder="Evil Rabbit" required />
          </Field>
          <Field>
            <FieldLabel for="card-number">Card number</FieldLabel>
            <Input
              id="card-number"
              name="number"
              inputmode="numeric"
              placeholder="1234 5678 9012 3456"
              required
            />
            <FieldDescription>Enter your 16-digit card number.</FieldDescription>
          </Field>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem">
            <Field>
              <FieldLabel for="card-month">Month</FieldLabel>
              <NativeSelect id="card-month" name="month" style="width: 100%">
                {Array.from({ length: 12 }, (_, i) => (
                  <NativeSelectOption>{String(i + 1).padStart(2, '0')}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel for="card-cvv">CVV</FieldLabel>
              <Input id="card-cvv" name="cvv" inputmode="numeric" placeholder="123" required />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend>Billing address</FieldLegend>
        <FieldDescription>The billing address for this payment method.</FieldDescription>
        <Field orientation="horizontal">
          <Checkbox id="same-address" name="same" checked />
          <FieldLabel for="same-address" style="font-weight: 400">
            Same as shipping address
          </FieldLabel>
        </Field>
      </FieldSet>
      <Field>
        <FieldLabel for="card-comments">Comments</FieldLabel>
        <Textarea id="card-comments" name="comments" placeholder="Add any comments" />
      </Field>
      <Field orientation="horizontal">
        <Button type="submit">Submit</Button>
        <Button type="reset" variant="outline">
          Cancel
        </Button>
      </Field>
    </FieldGroup>
  </form>
)
