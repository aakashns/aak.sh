import { Button } from '../ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card.tsx'
import { Input } from '../ui/input.tsx'
import { Label } from '../ui/label.tsx'

export default () => (
  <Card style="width: 100%; max-width: 24rem">
    <CardHeader>
      <CardTitle>Log in to your account</CardTitle>
      <CardDescription>Enter your email below to log in.</CardDescription>
    </CardHeader>
    <CardContent>
      <form id="card-login" style="display: grid; gap: 0.5rem">
        <Label for="card-email">Email</Label>
        <Input id="card-email" type="email" placeholder="m@example.com" required />
      </form>
    </CardContent>
    <CardFooter>
      <Button type="submit" form="card-login" style="width: 100%">
        Log in
      </Button>
    </CardFooter>
  </Card>
)
