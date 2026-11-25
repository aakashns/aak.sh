import { Button } from '../ui/button.tsx'
import { Textarea } from '../ui/textarea.tsx'

// Count what's typed, and stop at 140.
export default () => (
  <div data-signals:post="''" style="display: grid; gap: 0.5rem; width: 100%; max-width: 24rem">
    <Textarea placeholder="What's happening?" aria-label="Post" maxlength="140" data-bind:post />
    <div style="display: flex; align-items: center; justify-content: space-between">
      <span
        style="color: var(--muted-foreground); font-size: 0.875rem"
        data-text="140 - $post.length + ' left'"
      >
        140 left
      </span>
      <Button size="sm" data-attr:disabled="!$post.trim()" disabled>
        Post
      </Button>
    </div>
  </div>
)
