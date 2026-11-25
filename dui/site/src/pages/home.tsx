// The home page: what dui is, how to get it, and a dashboard made of its components, with
// Datastar wiring a few of them together.
import type { Html } from '../lib/jsx/jsx-runtime.ts'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion.tsx'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert.tsx'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.tsx'
import { Badge } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card.tsx'
import { Checkbox } from '../ui/checkbox.tsx'
import { Dialog, DialogClose, DialogFooter, DialogTrigger } from '../ui/dialog.tsx'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '../ui/field.tsx'
import { Input } from '../ui/input.tsx'
import { Kbd } from '../ui/kbd.tsx'
import { NativeSelect, NativeSelectOption } from '../ui/native-select.tsx'
import { Progress } from '../ui/progress.tsx'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.tsx'
import { Separator } from '../ui/separator.tsx'
import { Skeleton } from '../ui/skeleton.tsx'
import { Switch } from '../ui/switch.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table.tsx'
import { createTabs } from '../ui/tabs.tsx'
import { Textarea } from '../ui/textarea.tsx'
import { CodeBlock } from './code.tsx'
import { Document } from './layout.tsx'

export const DESCRIPTION =
  'Components for Datastar, in the style of shadcn/ui: server-rendered JSX and plain CSS that you copy into your project and own.'

export const INSTALL = 'curl -fsSL https://dui.aak.sh/install.sh | sh'

const Icon = (props: { d: string[] }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {props.d.map((d) => (
      <path d={d} />
    ))}
  </svg>
)

const STATS = [
  { label: 'Revenue', value: '$45,231', change: '+20.1%', goal: 72 },
  { label: 'Subscriptions', value: '2,350', change: '+180', goal: 47 },
  { label: 'Sales', value: '12,234', change: '+19%', goal: 88 },
  { label: 'Active now', value: '573', change: '+201', goal: 64 },
]

const ORDERS = [
  { name: 'Olivia Martin', email: 'olivia@example.com', status: 'Paid', amount: '$1,999.00' },
  { name: 'Jackson Lee', email: 'jackson@example.com', status: 'Pending', amount: '$39.00' },
  { name: 'Isabella Nguyen', email: 'isabella@example.com', status: 'Paid', amount: '$299.00' },
  { name: 'William Kim', email: 'will@example.com', status: 'Refunded', amount: '$99.00' },
  { name: 'Sofia Davis', email: 'sofia@example.com', status: 'Paid', amount: '$39.00' },
]

const TEAM = [
  { name: 'shadcn', role: 'owner' },
  { name: 'leerob', role: 'admin' },
  { name: 'evilrabbit', role: 'member' },
]

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')

const statusBadge = (status: string) =>
  status === 'Paid' ? 'secondary' : status === 'Refunded' ? 'destructive' : 'outline'

const Orders = createTabs('orders', 'all')

const OrdersTable = (props: { status?: string }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Customer</TableHead>
        <TableHead>Status</TableHead>
        <TableHead style="text-align: right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {ORDERS.filter((o) => !props.status || o.status === props.status).map((order) => (
        <TableRow>
          <TableCell>
            <div class="person">
              <Avatar>
                <AvatarFallback>{initials(order.name)}</AvatarFallback>
              </Avatar>
              <div>
                <div class="person-name">{order.name}</div>
                <div class="muted">{order.email}</div>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={statusBadge(order.status)}>{order.status}</Badge>
          </TableCell>
          <TableCell style="text-align: right">{order.amount}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

const Dashboard = (): Html => (
  <div
    class="app"
    data-signals="{name: 'Evil Rabbit', email: 'rabbit@example.com', plan: 'pro', digest: true, mentions: true, product: false}"
    data-computed:email-ok="$email.includes('@')"
  >
    <header class="app-bar">
      <strong>Acme Inc</strong>
      <nav class="app-nav">
        <a href="#" aria-current="page">
          Overview
        </a>
        <a href="#">Customers</a>
        <a href="#">Products</a>
        <a href="#">Settings</a>
      </nav>
      <div class="app-search">
        <Input type="search" placeholder="Search…" aria-label="Search" />
        <Kbd>/</Kbd>
      </div>
      <Avatar>
        <AvatarImage src="https://github.com/evilrabbit.png" alt="" />
        <AvatarFallback data-text="$name.split(' ').map(w => w[0]).join('')">ER</AvatarFallback>
      </Avatar>
    </header>
    <div class="app-body">
      <div class="app-title">
        <div>
          <h2>Dashboard</h2>
          <p class="muted">
            Welcome back, <span data-text="$name.split(' ')[0] || 'friend'">Evil</span>.
          </p>
        </div>
        <div class="row">
          <NativeSelect size="sm" aria-label="Period">
            <NativeSelectOption>Last 30 days</NativeSelectOption>
            <NativeSelectOption>Last 7 days</NativeSelectOption>
            <NativeSelectOption>This year</NativeSelectOption>
          </NativeSelect>
          <Button size="sm">
            <Icon d={['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3']} />
            Download
          </Button>
        </div>
      </div>

      <Alert>
        <Icon d={['M12 16v-4', 'M12 8h.01', 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z']} />
        <AlertTitle>Your trial ends in 3 days</AlertTitle>
        <AlertDescription>Pick a plan below to keep your dashboards and data.</AlertDescription>
      </Alert>

      <div class="stats">
        {STATS.map((stat) => (
          <Card>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle class="stat">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent class="stat-goal">
              <Progress value={String(stat.goal)} aria-label={`${stat.label} goal`} />
              <div class="row muted">
                <Badge variant="outline">{stat.change}</Badge>
                {stat.goal}% of goal
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div class="panels">
        <Card class="span-2">
          <CardHeader>
            <CardTitle as="h3">Recent orders</CardTitle>
            <CardDescription>You made 265 sales this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <Orders.Tabs>
              <Orders.TabsList aria-label="Orders by status">
                <Orders.TabsTrigger value="all">All</Orders.TabsTrigger>
                <Orders.TabsTrigger value="paid">Paid</Orders.TabsTrigger>
                <Orders.TabsTrigger value="pending">Pending</Orders.TabsTrigger>
              </Orders.TabsList>
              <Orders.TabsContent value="all">
                <OrdersTable />
              </Orders.TabsContent>
              <Orders.TabsContent value="paid">
                <OrdersTable status="Paid" />
              </Orders.TabsContent>
              <Orders.TabsContent value="pending">
                <OrdersTable status="Pending" />
              </Orders.TabsContent>
            </Orders.Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h3">Team</CardTitle>
            <CardDescription>Invite people to work with you.</CardDescription>
          </CardHeader>
          <CardContent class="team">
            <form class="invite">
              <Input type="email" placeholder="Email" aria-label="Email to invite" />
              <Button type="submit" variant="outline">
                Invite
              </Button>
            </form>
            <Separator />
            {TEAM.map((person) => (
              <div class="person">
                <Avatar>
                  <AvatarImage src={`https://github.com/${person.name}.png`} alt="" />
                  <AvatarFallback>{person.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div class="person-name">@{person.name}</div>
                <NativeSelect size="sm" aria-label={`@${person.name}'s role`}>
                  {['owner', 'admin', 'member'].map((role) => (
                    <NativeSelectOption value={role} selected={role === person.role}>
                      {role[0]!.toUpperCase() + role.slice(1)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h3">Profile</CardTitle>
            <CardDescription>How others see you.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup class="tight">
              <Field>
                <FieldLabel for="home-name">Name</FieldLabel>
                <Input id="home-name" value="Evil Rabbit" data-bind:name />
              </Field>
              <Field data-invalid="false" data-attr:data-invalid="String(!$emailOk)">
                <FieldLabel for="home-email">Email</FieldLabel>
                <Input
                  id="home-email"
                  type="email"
                  value="rabbit@example.com"
                  data-bind:email
                  data-attr:aria-invalid="String(!$emailOk)"
                />
                <FieldError data-text="$emailOk ? '' : 'Enter an email address.'"></FieldError>
              </Field>
              <Field>
                <FieldLabel for="home-bio">Bio</FieldLabel>
                <Textarea id="home-bio" placeholder="A sentence or two about you." />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button data-attr:disabled="!$emailOk">Save</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h3">Notifications</CardTitle>
            <CardDescription>
              <span data-text="[$digest, $mentions, $product].filter(Boolean).length">2</span> of 3
              on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup class="tight">
              {[
                ['digest', 'Weekly digest', 'A summary of your week, on Mondays.'],
                ['mentions', 'Mentions', 'When someone mentions you.'],
                ['product', 'Product news', 'New features, now and then.'],
              ].map(([signal, title, description]) => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel for={`home-${signal}`}>{title}</FieldLabel>
                    <FieldDescription>{description}</FieldDescription>
                  </FieldContent>
                  <Switch
                    id={`home-${signal}`}
                    checked={signal !== 'product'}
                    {...{ [`data-bind:${signal}`]: true }}
                  />
                </Field>
              ))}
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h3">Plan</CardTitle>
            <CardDescription>Change it whenever you like.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup class="tight">
              <RadioGroup aria-label="Plan">
                {[
                  ['starter', 'Starter', 'For one person. $9/month.'],
                  ['pro', 'Pro', 'For teams. $29/month.'],
                ].map(([value, title, description]) => (
                  <FieldLabel>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle id={`home-plan-${value}-title`}>{title}</FieldTitle>
                        <FieldDescription id={`home-plan-${value}-description`}>
                          {description}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        name="plan"
                        value={value}
                        checked={value === 'pro'}
                        aria-labelledby={`home-plan-${value}-title`}
                        aria-describedby={`home-plan-${value}-description`}
                        data-bind:plan
                      />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
              <Field orientation="horizontal">
                <Checkbox id="home-yearly" />
                <FieldLabel for="home-yearly">Pay yearly, and save 17%</FieldLabel>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button style="width: 100%">
              <span data-text="'Choose ' + ($plan === 'pro' ? 'Pro' : 'Starter')">Choose Pro</span>
            </Button>
          </CardFooter>
        </Card>

        <Card class="span-2">
          <CardHeader>
            <CardTitle as="h3">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion>
              <AccordionItem name="home-faq" open>
                <AccordionTrigger>Is any of this JavaScript?</AccordionTrigger>
                <AccordionContent>
                  Only Datastar's: the tabs, the greeting, and the counts are signals. The rest is
                  HTML the server rendered, and CSS.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem name="home-faq">
                <AccordionTrigger>Can I change how a component looks?</AccordionTrigger>
                <AccordionContent>
                  Yes. dui copies its code into your project, so it's yours to edit.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem name="home-faq">
                <AccordionTrigger>Does it work with my server?</AccordionTrigger>
                <AccordionContent>
                  The components are JSX that renders to strings on Bun. Anything that can send HTML
                  can send them.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h3">Danger zone</CardTitle>
            <CardDescription>Things you can't take back.</CardDescription>
          </CardHeader>
          <CardContent class="loading">
            <Skeleton style="width: 2.5rem; height: 2.5rem; border-radius: 9999px" />
            <div>
              <Skeleton style="height: 0.75rem; width: 100%" />
              <Skeleton style="height: 0.75rem; width: 70%" />
            </div>
          </CardContent>
          <CardFooter>
            <DialogTrigger dialog="home-delete" variant="destructive" style="width: 100%">
              Delete workspace
            </DialogTrigger>
            <Dialog
              id="home-delete"
              title="Delete Acme Inc?"
              description="This deletes the workspace, its dashboards, and its data. It can't be undone."
            >
              <DialogFooter>
                <DialogClose dialog="home-delete" variant="outline">
                  Cancel
                </DialogClose>
                <DialogClose dialog="home-delete" variant="destructive">
                  Delete
                </DialogClose>
              </DialogFooter>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
)

export const Home = (): Html => (
  <Document path="/" title="dui · Datastar UI components" description={DESCRIPTION}>
    <main class="home">
      <section class="hero">
        <h1>Datastar UI</h1>
        <p class="lead">{DESCRIPTION}</p>
        <div class="row">
          <Button href="/docs">Get started</Button>
          <Button href="/docs/components" variant="outline">
            Components
          </Button>
        </div>
        <CodeBlock code={INSTALL} class="install" />
      </section>
      <section class="showcase" aria-label="A dashboard made of dui's components">
        <Dashboard />
        <p class="muted caption">
          Every piece of this dashboard is a dui component.{' '}
          <a href="/docs/components">Browse them all</a>.
        </p>
      </section>
    </main>
  </Document>
)
