import { Skeleton } from '../ui/skeleton.tsx'

export default () => (
  <div style="display: grid; gap: 0.75rem">
    <Skeleton style="width: 15rem; height: 8rem; border-radius: 0.75rem" />
    <Skeleton style="width: 15rem; height: 1rem" />
    <Skeleton style="width: 12rem; height: 1rem" />
  </div>
)
