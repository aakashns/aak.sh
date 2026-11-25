import { Button } from '../ui/button.tsx'
import { createTabs } from '../ui/tabs.tsx'

const { Tabs, TabsList, TabsTrigger, TabsContent } = createTabs('billing', 'monthly')

// The open tab is a signal, so anything on the page can read it or switch tabs.
export default () => (
  <Tabs style="align-items: center">
    <TabsList aria-label="Billing period">
      <TabsTrigger value="monthly">Monthly</TabsTrigger>
      <TabsTrigger value="yearly">Yearly</TabsTrigger>
    </TabsList>
    <TabsContent value="monthly">
      <p style="font-size: 1.5rem; font-weight: 600; margin: 0.5rem 0">$12 / month</p>
    </TabsContent>
    <TabsContent value="yearly">
      <p style="font-size: 1.5rem; font-weight: 600; margin: 0.5rem 0">$120 / year</p>
    </TabsContent>
    <Button
      variant="link"
      size="sm"
      data-on:click="$billing = $billing === 'monthly' ? 'yearly' : 'monthly'"
    >
      Switch to <span data-text="$billing === 'monthly' ? 'yearly' : 'monthly'">yearly</span>
    </Button>
  </Tabs>
)
