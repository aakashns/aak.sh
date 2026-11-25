// Every page's <html>: its <head> (title, search and link preview tags, icons, the inlined CSS),
// the header, and the docs' sidebar.
import { raw, type Child, type Html } from '../lib/jsx/jsx-runtime.ts'
import { components, SOURCES } from '../registry.ts'
import siteCss from './site.css' with { type: 'text' }

export const SITE_URL = 'https://dui.aak.sh'
export const GITHUB_URL = 'https://github.com/aakashns/aak.sh/tree/main/dui'

// The theme, every component's CSS, and then the site's.
const CSS = [
  SOURCES['lib/theme.css'],
  ...components.map((c) => SOURCES[`ui/${c.name}.css`]),
  siteCss,
].join('\n')

export function Document(props: {
  path: string
  title: string
  description: string
  children?: Child
}): Html {
  let { path, title, description, children } = props
  let url = SITE_URL + path
  return raw(
    '<!DOCTYPE html>' +
      (
        <html lang="en" class="dark">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />
            <link rel="icon" href="/favicon.ico" sizes="32x32" />
            <link rel="icon" href="/icon.svg" type="image/svg+xml" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <meta name="theme-color" content="#000000" />
            <meta property="og:site_name" content="dui" />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={`${SITE_URL}/social.png`} />
            <meta name="twitter:card" content="summary_large_image" />
            <style>{raw(CSS)}</style>
            <script type="module" src="/datastar.js"></script>
          </head>
          <body>
            <header class="header">
              <a href="/" class="logo">
                dui
              </a>
              <nav>
                <a href="/docs">Docs</a>
                <a href="/docs/components">Components</a>
                <a href={GITHUB_URL}>GitHub</a>
              </nav>
            </header>
            {children}
          </body>
        </html>
      ).value,
  )
}

// A docs page: the sidebar, and the page's heading and content.
export function DocsPage(props: {
  path: string
  title: string
  description: string
  children?: Child
}): Html {
  let { path, title, description, children } = props
  let link = (href: string, text: string) => (
    <a href={href} aria-current={href === path ? 'page' : undefined}>
      {text}
    </a>
  )
  return (
    <Document path={path} title={`${title} · dui`} description={description}>
      <div class="docs">
        <aside>
          <h4>Getting started</h4>
          {link('/docs', 'Introduction')}
          {link('/docs/installation', 'Installation')}
          <h4>Components</h4>
          {components.map((c) => link(`/docs/components/${c.name}`, c.title))}
        </aside>
        <main>
          <h1>{title}</h1>
          <p class="lead">{description}</p>
          {children}
        </main>
      </div>
    </Document>
  )
}
