// Tabs whose state is a Datastar signal. createTabs() makes a set for one signal and the tab it
// starts on, so the page is rendered showing that tab, and Datastar switches tabs from there:
//
//   const { Tabs, TabsList, TabsTrigger, TabsContent } = createTabs('plan', 'monthly')
//
//   <Tabs>
//     <TabsList>
//       <TabsTrigger value="monthly">Monthly</TabsTrigger>
//       <TabsTrigger value="yearly">Yearly</TabsTrigger>
//     </TabsList>
//     <TabsContent value="monthly">…</TabsContent>
//     <TabsContent value="yearly">…</TabsContent>
//   </Tabs>
//
// $plan is the open tab's value, for the rest of the page to read or set.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './tabs.css' with { type: 'text' }

export const TABS_CSS = css

type Props = Record<string, unknown> & { children?: Child }

export function createTabs(signal: string, defaultValue: string) {
  let id = (part: string, value: string) => `${signal}-${part}-${value}`
  let is = (value: string) => `$${signal} === ${JSON.stringify(value)}`

  function Tabs(props: Props): Html {
    let { children, ...attributes } = props
    return (
      <div
        data-slot="tabs"
        data-signals={`{${signal}: ${JSON.stringify(defaultValue)}}`}
        {...attributes}
      >
        {children}
      </div>
    )
  }

  function TabsList(props: Props): Html {
    let { children, ...attributes } = props
    return (
      <div role="tablist" data-slot="tabs-list" {...attributes}>
        {children}
      </div>
    )
  }

  function TabsTrigger(props: Props & { value: string }): Html {
    let { value, children, ...attributes } = props
    return (
      <button
        type="button"
        role="tab"
        id={id('tab', value)}
        aria-controls={id('panel', value)}
        aria-selected={value === defaultValue}
        data-attr:aria-selected={`String(${is(value)})`}
        data-on:click={`$${signal} = ${JSON.stringify(value)}`}
        data-slot="tabs-trigger"
        {...attributes}
      >
        {children}
      </button>
    )
  }

  function TabsContent(props: Props & { value: string }): Html {
    let { value, children, ...attributes } = props
    return (
      <div
        role="tabpanel"
        id={id('panel', value)}
        aria-labelledby={id('tab', value)}
        hidden={value !== defaultValue}
        data-attr:hidden={`!(${is(value)})`}
        data-slot="tabs-content"
        {...attributes}
      >
        {children}
      </div>
    )
  }

  return { Tabs, TabsList, TabsTrigger, TabsContent }
}
