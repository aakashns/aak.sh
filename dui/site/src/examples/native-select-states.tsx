import { NativeSelect, NativeSelectOption } from '../ui/native-select.tsx'

export default () => (
  <>
    <NativeSelect size="sm" aria-label="Small">
      <NativeSelectOption>Small</NativeSelectOption>
    </NativeSelect>
    <NativeSelect disabled aria-label="Disabled">
      <NativeSelectOption>Disabled</NativeSelectOption>
    </NativeSelect>
    <NativeSelect aria-invalid="true" aria-label="Invalid">
      <NativeSelectOption>Invalid</NativeSelectOption>
    </NativeSelect>
  </>
)
