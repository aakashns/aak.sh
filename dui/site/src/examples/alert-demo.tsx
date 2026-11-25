import { Alert, AlertDescription, AlertTitle } from '../ui/alert.tsx'

export default () => (
  <Alert style="max-width: 28rem">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
    <AlertTitle>Your changes are saved</AlertTitle>
    <AlertDescription>They'll show up on your profile in a minute.</AlertDescription>
  </Alert>
)
