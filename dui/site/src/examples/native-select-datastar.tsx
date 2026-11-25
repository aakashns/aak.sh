import { NativeSelect, NativeSelectOption } from '../ui/native-select.tsx'

export default () => (
  <div data-signals:fruit="'apple'" style="display: grid; gap: 0.75rem; justify-items: center">
    <NativeSelect aria-label="Fruit" data-bind:fruit>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
    </NativeSelect>
    <p style="margin: 0">
      You picked <strong data-text="$fruit">apple</strong>.
    </p>
  </div>
)
