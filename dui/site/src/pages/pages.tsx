// The site's pages, at shadcn/ui's URLs: /docs, /docs/installation, /docs/components, and
// /docs/components/<name>.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import { components, lib, type RegistryItem } from '../registry.ts'
import { Button } from '../ui/button.tsx'
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card.tsx'
import { readSource } from '../sources.ts' with { type: 'macro' }
import { CodeBlock } from './code.tsx'
import { docs, type Example } from './examples.tsx'
import { DESCRIPTION, INSTALL } from './home.tsx'
import { Document, DocsPage, GITHUB_URL } from './layout.tsx'

export { Home } from './home.tsx'

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

// The quickstart, as CI runs it in a new project (see .github/workflows/dui-release.yml).
const QUICKSTART = readSource('../quickstart/index.tsx')

const SETUP = `// package.json: ./src/lib/jsx/*.ts where lib/ is in src/
"imports": { "#jsx/*": "./lib/jsx/*.ts" }

// tsconfig.json
"compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "#jsx" }`

export const Installation = (): Html => (
  <DocsPage
    path="/docs/installation"
    title="Installation"
    description="Add dui's components to a Bun project."
  >
    <h2 id="install">Install the CLI</h2>
    <p>
      <code>dui</code> is one binary, for Linux and macOS. This puts it in{' '}
      <code>/usr/local/bin</code>, and running it again upgrades it:
    </p>
    <CodeBlock code={INSTALL} />
    <p>
      The components come with it, so each version of dui adds the same code. Set{' '}
      <code>DUI_VERSION</code> to install a particular one.
    </p>
    <h2 id="init">Set up your project</h2>
    <p>
      Run this in your project's folder, beside its <code>package.json</code> (<code>bun init</code>{' '}
      makes one):
    </p>
    <CodeBlock code="dui init" />
    <p>
      It writes the JSX runtime and the theme to <code>lib/</code>, in <code>src/</code> if there's
      one (or wherever <code>--dir</code> says), and points JSX at them. Running it again only adds
      what's missing. To do that by hand:
    </p>
    <CodeBlock code={SETUP} />
    <h2 id="add">Add components</h2>
    <CodeBlock code="dui add button" />
    <p>
      It copies each component, and the ones it uses, into <code>ui/</code> beside <code>lib/</code>
      , and lists every stylesheet there in <code>ui/styles.ts</code>. <code>dui list</code> shows
      every component, and each component's page has the command for each example.
    </p>
    <p>
      A file you've changed is yours: <code>add</code> keeps it, <code>--dry-run</code> says what it
      would write, <code>dui diff</code> shows how your copies differ from dui's, and{' '}
      <code>--overwrite</code> replaces the files of the components you name, and only those.
    </p>
    <h2 id="use-them">Use them</h2>
    <p>
      Save this as <code>index.tsx</code>, in the folder with <code>ui/</code> and <code>lib/</code>
      :
    </p>
    <CodeBlock code={QUICKSTART} title="index.tsx" />
    <p>
      Then run <code>bun index.tsx</code> (or <code>bun src/index.tsx</code>), and open{' '}
      <code>http://localhost:3000</code>. <code>DUI_CSS</code> is the theme and every component's
      CSS, for the page to inline: add your own after it. The theme sets the page's font, colors,
      and <code>box-sizing</code>, and follows the system's light or dark mode; put{' '}
      <code>class="dark"</code> or <code>class="light"</code> on <code>&lt;html&gt;</code> to pick
      one, or change its variables to make it yours.
    </p>
    <p>
      Every file is also on the site at its path in your project, like{' '}
      <a href="/ui/button.css">/ui/button.css</a> and <a href="/lib/theme.css">/lib/theme.css</a>,
      to read or copy by hand.
    </p>
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

const GITHUB_SOURCE = 'https://github.com/aakashns/aak.sh/blob/main/dui/site/src'

const titleOf = (name: string) => components.find((c) => c.name === name)?.title ?? name

// A list of links to components' pages, like "Field and Input".
const componentLinks = (names: string[]): Child[] =>
  names.flatMap((name, i) => [
    i === 0 ? '' : i === names.length - 1 ? ' and ' : ', ',
    <a href={`/docs/components/${name}`}>{titleOf(name)}</a>,
  ])

const ExampleBlock = (props: { item: RegistryItem; example: Example }): Html => {
  let { item, example } = props
  let others = example.uses.filter((name) => name !== item.name)
  return (
    <div class="example">
      <div class="preview">{example.render()}</div>
      {others.length ? (
        <p class="uses">
          Also uses {componentLinks(others)}:{' '}
          <code>dui add {[item.name, ...others].join(' ')}</code>
        </p>
      ) : null}
      <CodeBlock code={example.code} title={`${example.slug}.tsx`} />
    </div>
  )
}

const FileIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
)

export const ComponentPage = (props: { item: RegistryItem }): Html => {
  let { item } = props
  let { examples, shadcn } = docs[item.name]!
  let [demo, ...more] = examples
  let index = components.indexOf(item)
  let previous = components[index - 1]
  let next = components[index + 1]
  let deps = item.registryDependencies.filter((name) => name !== 'lib')
  return (
    <DocsPage
      path={`/docs/components/${item.name}`}
      title={item.title}
      description={item.description}
    >
      <div class="files">
        {item.files.map((path) => (
          <Button href={`/${path}`} variant="outline" size="sm">
            <FileIcon />
            {path.split('/').pop()}
          </Button>
        ))}
        <Button href={`${GITHUB_SOURCE}/${item.files[0]}`} variant="ghost" size="sm">
          GitHub
        </Button>
        <Button
          href={`https://ui.shadcn.com/docs/components/${item.name}`}
          variant="ghost"
          size="sm"
        >
          shadcn/ui
        </Button>
      </div>
      {demo ? <ExampleBlock item={item} example={demo} /> : null}
      <h2 id="installation">Installation</h2>
      <CodeBlock code={`dui add ${item.name}`} />
      <p>
        Or copy {item.files.map((path, i) => [i ? ' and ' : '', <a href={`/${path}`}>{path}</a>])}{' '}
        into your project, with{' '}
        {lib.files.map((path, i) => [
          i === 0 ? '' : i === lib.files.length - 1 ? ', and ' : ', ',
          <a href={`/${path}`}>{path}</a>,
        ])}
        {deps.length ? <> and {componentLinks(deps)}</> : null}.
      </p>
      {more.length ? <h2 id="examples">Examples</h2> : null}
      {more.map((example) => (
        <>
          <h3 id={example.slug}>{example.title}</h3>
          <ExampleBlock item={item} example={example} />
        </>
      ))}
      <h2 id="shadcn">Compared to shadcn/ui</h2>
      <ul class="differences">
        {shadcn.map((difference) => (
          <li>{difference}</li>
        ))}
      </ul>
      <nav class="pager">
        {previous ? (
          <Button href={`/docs/components/${previous.name}`} variant="outline" size="sm">
            ← {previous.title}
          </Button>
        ) : (
          <span></span>
        )}
        {next ? (
          <Button href={`/docs/components/${next.name}`} variant="outline" size="sm">
            {next.title} →
          </Button>
        ) : null}
      </nav>
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
