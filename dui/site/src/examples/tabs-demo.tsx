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
import { createTabs } from '../ui/tabs.tsx'

// The $settings signal holds the open tab, starting with "account".
const { Tabs, TabsList, TabsTrigger, TabsContent } = createTabs('settings', 'account')

export default () => (
  <Tabs style="width: 100%; max-width: 24rem">
    <TabsList>
      <TabsTrigger value="account">Account</TabsTrigger>
      <TabsTrigger value="password">Password</TabsTrigger>
    </TabsList>
    <TabsContent value="account">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Change your name here, then save.</CardDescription>
        </CardHeader>
        <CardContent style="display: grid; gap: 0.75rem">
          <Label for="tabs-name">Name</Label>
          <Input id="tabs-name" value="Pedro Duarte" />
        </CardContent>
        <CardFooter>
          <Button>Save changes</Button>
        </CardFooter>
      </Card>
    </TabsContent>
    <TabsContent value="password">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password here.</CardDescription>
        </CardHeader>
        <CardContent style="display: grid; gap: 0.75rem">
          <Label for="tabs-password">New password</Label>
          <Input id="tabs-password" type="password" />
        </CardContent>
        <CardFooter>
          <Button>Save password</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  </Tabs>
)
