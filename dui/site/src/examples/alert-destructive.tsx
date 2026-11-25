import { Alert, AlertDescription, AlertTitle } from '../ui/alert.tsx'

export default () => (
  <Alert variant="destructive" style="max-width: 28rem">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
    <AlertTitle>Your payment didn't go through</AlertTitle>
    <AlertDescription>
      <p>Check your card's details and try again:</p>
      <ul style="margin: 0; padding-left: 1rem">
        <li>Is the card number right?</li>
        <li>Has the card expired?</li>
      </ul>
    </AlertDescription>
  </Alert>
)
