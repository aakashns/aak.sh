import { Label } from '../ui/label.tsx'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.tsx'

export default () => (
  <RadioGroup aria-label="Spacing">
    {['Default', 'Comfortable', 'Compact'].map((option) => (
      <Label>
        <RadioGroupItem
          name="spacing"
          value={option.toLowerCase()}
          checked={option === 'Comfortable'}
        />
        {option}
      </Label>
    ))}
  </RadioGroup>
)
