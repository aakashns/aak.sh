import { Skeleton } from '../ui/skeleton.tsx'

export default () => (
  <div style="display: flex; align-items: center; gap: 1rem">
    <Skeleton style="width: 3rem; height: 3rem; border-radius: 9999px" />
    <div style="display: grid; gap: 0.5rem">
      <Skeleton style="width: 15rem; height: 1rem" />
      <Skeleton style="width: 12rem; height: 1rem" />
    </div>
  </div>
)
