import { Button } from '../ui/button.tsx'
import { Progress } from '../ui/progress.tsx'

// data-attr:value moves the bar as the signal changes.
export default () => (
  <div data-signals:done="40" style="display: grid; gap: 1rem; width: 100%; max-width: 20rem">
    <Progress value="40" data-attr:value="$done" aria-label="Done" />
    <div style="display: flex; gap: 0.5rem">
      <Button size="sm" variant="outline" data-on:click="$done = Math.max(0, $done - 20)">
        − 20
      </Button>
      <Button size="sm" variant="outline" data-on:click="$done = Math.min(100, $done + 20)">
        + 20
      </Button>
      <span data-text="$done + '%'" style="margin-left: auto">
        40%
      </span>
    </div>
  </div>
)
