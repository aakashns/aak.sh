import { Button } from '../ui/button.tsx'

export default () => (
  <>
    <Button size="sm" variant="outline">
      Small
    </Button>
    <Button variant="outline">Default</Button>
    <Button size="lg" variant="outline">
      Large
    </Button>
    <Button size="icon" variant="outline" aria-label="Next">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Button>
  </>
)
