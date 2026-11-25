import { Separator } from '../ui/separator.tsx'

export default () => (
  <div style="width: 100%; max-width: 20rem">
    <div style="display: grid; gap: 0.25rem">
      <h4 style="margin: 0; font-size: 0.875rem; font-weight: 500">Datastar UI</h4>
      <p style="margin: 0; color: var(--muted-foreground); font-size: 0.875rem">
        Components you copy and own.
      </p>
    </div>
    <Separator style="margin-block: 1rem" />
    <div style="display: flex; align-items: center; gap: 1rem; height: 1.25rem; font-size: 0.875rem">
      <span>Blog</span>
      <Separator orientation="vertical" />
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>Source</span>
    </div>
  </div>
)
