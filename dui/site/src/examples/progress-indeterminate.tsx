import { Progress } from '../ui/progress.tsx'

// Without a value, it's indeterminate: the browser shows it as busy.
export default () => <Progress aria-label="Loading" style="max-width: 20rem" />
