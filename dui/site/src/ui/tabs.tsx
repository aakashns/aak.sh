// Tabs whose state is a Datastar signal. createTabs() makes a set for one signal and the tab it
// starts on, so the page is rendered showing that tab, and Datastar switches tabs from there:
//
//   const { Tabs, TabsList, TabsTrigger, TabsContent } = createTabs('plan', 'monthly')
//
//   <Tabs>
//     <TabsList aria-label="Billing period">
//       <TabsTrigger value="monthly">Monthly</TabsTrigger>
//       <TabsTrigger value="yearly">Yearly</TabsTrigger>
//     </TabsList>
//     <TabsContent value="monthly">…</TabsContent>
//     <TabsContent value="yearly">…</TabsContent>
//   </Tabs>
//
// $plan is the open tab's value, for the rest of the page to read or set. The signal names the
// parts' ids too, so give each set on a page a signal of its own.
//
// As in WAI-ARIA's tabs pattern, the open tab is the list's one stop in the Tab order: the arrow
// keys, Home, and End move between tabs and open them, and Tab moves on to the open panel.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './tabs.css' with { type: 'text' }

export const TABS_CSS = css

type Props = Record<string, unknown> & { children?: Child }

// The list's keys: focus the tab the key points to, skipping disabled ones, and click it to open
// it. `evt.target` is the focused tab.
const KEYS = `(tabs => (i => {
  let next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: -1 }[evt.key]
  if (next === undefined || i < 0) return
  evt.preventDefault()
  let tab = tabs.at(next % tabs.length)
  tab.focus()
  tab.click()
})(tabs.indexOf(evt.target)))([...el.querySelectorAll('[role=tab]:not(:disabled)')])`

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

  // Label it, with aria-label or aria-labelledby, to say what the tabs are for.
  function TabsList(props: Props): Html {
    let { children, ...attributes } = props
    return (
      <div role="tablist" data-on:keydown={KEYS} data-slot="tabs-list" {...attributes}>
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
        tabindex={value === defaultValue ? 0 : -1}
        data-attr:tabindex={`${is(value)} ? 0 : -1`}
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
        tabindex="0"
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
