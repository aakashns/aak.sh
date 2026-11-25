import { Badge } from '../ui/badge.tsx'

export default () => (
  <>
    <Badge variant="secondary">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Verified
    </Badge>
    <Badge style="min-width: 1.25rem; border-radius: 9999px; padding-inline: 0.25rem">8</Badge>
    <Badge
      variant="destructive"
      style="min-width: 1.25rem; border-radius: 9999px; padding-inline: 0.25rem"
    >
      99+
    </Badge>
  </>
)
