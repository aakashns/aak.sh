import { Textarea } from '../ui/textarea.tsx'

export default () => (
  <div style="display: grid; gap: 0.75rem; width: 100%; max-width: 24rem">
    <Textarea value="It grows as you type, up to what the page allows." aria-label="Message" />
    <Textarea placeholder="Disabled" aria-label="Disabled" disabled />
    <Textarea value="Too short" aria-label="Bio" aria-invalid="true" />
  </div>
)
