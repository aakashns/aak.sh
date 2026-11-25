import { Button } from '../ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card.tsx'

export default () => (
  <Card style="width: 100%; max-width: 22rem">
    <CardHeader>
      <CardTitle as="h3">Ship it</CardTitle>
      <CardDescription>Deploy your app in one click.</CardDescription>
    </CardHeader>
    <CardContent>Server-rendered HTML, styled with plain CSS.</CardContent>
    <CardFooter>
      <Button>Deploy</Button>
      <Button variant="outline">Cancel</Button>
    </CardFooter>
  </Card>
)
