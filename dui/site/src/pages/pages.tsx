// The site's pages, at shadcn/ui's URLs: /docs, /docs/installation, /docs/components, and
// /docs/components/<name>.
import type { Html } from '../lib/jsx/jsx-runtime.ts'
import { components, type RegistryItem } from '../registry.ts'
import { Button } from '../ui/button.tsx'
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card.tsx'
import { examples } from './examples.tsx'
import { Document, DocsPage, GITHUB_URL } from './layout.tsx'

const DESCRIPTION =
  'Components for Datastar, in the style of shadcn/ui: server-rendered JSX and plain CSS that you copy into your project and own.'

const INSTALL = 'curl -fsSL https://dui.aak.sh/install.sh | sh'

export const Home = (): Html => (
  <Document path="/" title="dui · Datastar UI components" description={DESCRIPTION}>
    <main class="hero">
      <h1>Datastar UI</h1>
      <p class="lead">{DESCRIPTION}</p>
      <div class="row">
        <Button href="/docs">Get started</Button>
        <Button href="/docs/components" variant="outline">
          Components
        </Button>
      </div>
      <pre>
        <code>{INSTALL}</code>
      </pre>
    </main>
  </Document>
)

export const Introduction = (): Html => (
  <DocsPage path="/docs" title="Introduction" description={DESCRIPTION}>
    <p>
      dui isn't a library you install and import. Its CLI copies each component's code into your
      project, in a <code>ui/</code> folder beside a <code>lib/</code> folder with what they share,
      so you can change it as you like.
    </p>
    <ul>
      <li>
        <strong>Server-rendered.</strong> Components are functions from props to HTML strings, with
        a tiny JSX runtime and no virtual DOM.
      </li>
      <li>
        <strong>Datastar-ready.</strong> Attributes like <code>data-bind</code> and{' '}
        <code>data-on:click</code> go straight on the element.
      </li>
      <li>
        <strong>Plain CSS.</strong> Each component has a CSS file of its own, themed with
        shadcn/ui's tokens.
      </li>
    </ul>
    <p>
      Start with <a href="/docs/installation">Installation</a>, then browse the{' '}
      <a href="/docs/components">components</a>. The code is on <a href={GITHUB_URL}>GitHub</a>.
    </p>
  </DocsPage>
)

const SETUP = `// package.json
"imports": { "#jsx/*": "./src/lib/jsx/*.ts" }

// tsconfig.json
"compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "#jsx" }`

const PAGE = `import { raw } from './lib/jsx/jsx-runtime.ts'
import theme from './lib/theme.css' with { type: 'text' }
import { Button, BUTTON_CSS } from './ui/button.tsx'

const page = (
  <html>
    <head>
      <style>{raw(theme + BUTTON_CSS)}</style>
      <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.4/bundles/datastar.js"></script>
    </head>
    <body data-signals:count="0">
      <Button data-on:click="$count++">Clicked <span data-text="$count"></span> times</Button>
    </body>
  </html>
)

Bun.serve({ routes: { '/': new Response('<!DOCTYPE html>' + page, { headers: { 'Content-Type': 'text/html' } }) } })`

export const Installation = (): Html => (
  <DocsPage
    path="/docs/installation"
    title="Installation"
    description="Add dui's components to a Bun project."
  >
    <h2>Install the CLI</h2>
    <p>
      <code>dui</code> is one binary, for Linux and macOS. This puts it in{' '}
      <code>/usr/local/bin</code>, and running it again upgrades it:
    </p>
    <pre>
      <code>{INSTALL}</code>
    </pre>
    <h2>Add components</h2>
    <p>
      Run this in your project. It writes the components to <code>src/ui/</code>, and the JSX
      runtime and theme they need to <code>src/lib/</code> (or <code>ui/</code> and{' '}
      <code>lib/</code> where there's no <code>src/</code>; pick another folder with{' '}
      <code>--dir</code>).
    </p>
    <pre>
      <code>dui add button card</code>
    </pre>
    <p>
      <code>dui list</code> shows every component.
    </p>
    <h2>Set up JSX</h2>
    <p>Point JSX at the runtime in lib/:</p>
    <pre>
      <code>{SETUP}</code>
    </pre>
    <h2>Use them</h2>
    <p>Each component exports its CSS as text, for the page to inline with the theme's:</p>
    <pre>
      <code>{PAGE}</code>
    </pre>
  </DocsPage>
)

export const ComponentList = (): Html => (
  <DocsPage
    path="/docs/components"
    title="Components"
    description="Every component dui can add to your project."
  >
    <div class="grid">
      {components.map((c) => (
        <a href={`/docs/components/${c.name}`}>
          <Card>
            <CardHeader>
              <CardTitle as="h2">{c.title}</CardTitle>
              <CardDescription>{c.description}</CardDescription>
            </CardHeader>
          </Card>
        </a>
      ))}
    </div>
  </DocsPage>
)

export const ComponentPage = (props: { item: RegistryItem }): Html => {
  let { item } = props
  let example = examples[item.name]!
  return (
    <DocsPage
      path={`/docs/components/${item.name}`}
      title={item.title}
      description={item.description}
    >
      <div class="preview">{example.preview()}</div>
      <h2>Installation</h2>
      <pre>
        <code>dui add {[item.name, ...(example.with ?? [])].join(' ')}</code>
      </pre>
      <h2>Usage</h2>
      <pre>
        <code>{example.code}</code>
      </pre>
    </DocsPage>
  )
}

export const NotFound = (): Html => (
  <Document path="/404" title="Not found · dui" description="This page doesn't exist.">
    <main class="hero">
      <h1>Not found</h1>
      <p class="lead">This page doesn't exist.</p>
      <Button href="/">Home</Button>
    </main>
  </Document>
)
