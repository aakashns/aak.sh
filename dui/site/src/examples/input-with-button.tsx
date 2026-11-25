import { Button } from '../ui/button.tsx'
import { Input } from '../ui/input.tsx'

export default () => (
  <form style="display: flex; gap: 0.5rem; width: 100%; max-width: 24rem">
    <Input type="email" placeholder="Email" aria-label="Email" />
    <Button type="submit" variant="outline">
      Subscribe
    </Button>
  </form>
)
