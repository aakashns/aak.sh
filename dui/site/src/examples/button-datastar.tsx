import { Button } from '../ui/button.tsx'

// Datastar's attributes go straight on the <button>.
export default () => (
  <div data-signals:count="0">
    <Button data-on:click="$count++">
      Clicked <span data-text="$count">0</span> times
    </Button>
  </div>
)
