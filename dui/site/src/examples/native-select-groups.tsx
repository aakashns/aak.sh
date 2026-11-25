import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '../ui/native-select.tsx'

export default () => (
  <NativeSelect aria-label="Department">
    <NativeSelectOption value="">Select department</NativeSelectOption>
    <NativeSelectOptGroup label="Engineering">
      <NativeSelectOption value="frontend">Frontend</NativeSelectOption>
      <NativeSelectOption value="backend">Backend</NativeSelectOption>
    </NativeSelectOptGroup>
    <NativeSelectOptGroup label="Sales">
      <NativeSelectOption value="sales-rep">Sales rep</NativeSelectOption>
      <NativeSelectOption value="account-manager">Account manager</NativeSelectOption>
    </NativeSelectOptGroup>
  </NativeSelect>
)
