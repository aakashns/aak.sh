// Every page's <html>: its <head> (title, search and link preview tags, icons, the inlined CSS),
// the header, and the docs' sidebar.
import { raw, type Child, type Html } from '../lib/jsx/jsx-runtime.ts'
import { components, SOURCES } from '../registry.ts'
import { Button } from '../ui/button.tsx'
import siteCss from './site.css' with { type: 'text' }

export const SITE_URL = 'https://dui.aak.sh'
export const GITHUB_URL = 'https://github.com/aakashns/aak.sh/tree/main/dui'

// The theme, every component's CSS, and then the site's.
const CSS = [
  SOURCES['lib/theme.css'],
  ...components.map((c) => SOURCES[`ui/${c.name}.css`]),
  siteCss,
].join('\n')

// Sets the scheme to `theme`, a variable in the expression, on the page and the switch (`el`).
const APPLY_THEME = [
  'document.documentElement.className = theme',
  "document.querySelector('meta[name=theme-color]').content = theme == 'light' ? '#ffffff' : '#000000'",
  "el.setAttribute('aria-pressed', String(theme != 'light'))",
].join('; ')

// A click flips the scheme and keeps it for a year. A page the browser restores on Back or
// Forward is as it was, so it takes the cookie's scheme, which may have changed since.
const SWITCH_THEME = [
  "let theme = document.documentElement.classList.contains('light') ? 'dark' : 'light'",
  APPLY_THEME,
  "document.cookie = 'theme=' + theme + '; path=/; max-age=31536000; samesite=lax'",
].join('; ')
const RESTORE_THEME = [
  "let theme = document.cookie.split('; ').includes('theme=light') ? 'light' : 'dark'",
  APPLY_THEME,
].join('; ')

// The header's switch: pressed in dark mode, showing the scheme it switches to.
const ThemeSwitch = (props: { dark: boolean }) => (
  <Button
    variant="ghost"
    size="icon"
    class="theme-switch"
    aria-label="Dark mode"
    aria-pressed={String(props.dark)}
    data-on:click={SWITCH_THEME}
    data-on:pageshow__window={RESTORE_THEME}
  >
    <svg
      class="sun"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2m-7.07-2.93 1.41-1.41m11.32-11.32 1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41" />
    </svg>
    <svg
      class="moon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  </Button>
)

// Pages render dark, and the server swaps these for a `theme=light` cookie, which the header's
// switch sets: no script runs before the first paint, so the page can't flash the other scheme.
const SWAPS = [
  ['<html lang="en" class="dark">', '<html lang="en" class="light">'],
  ['<meta name="theme-color" content="#000000">', '<meta name="theme-color" content="#ffffff">'],
  [ThemeSwitch({ dark: true }).value, ThemeSwitch({ dark: false }).value],
] as const

export const lightPage = (page: string) =>
  SWAPS.reduce((page, [dark, light]) => page.replace(dark, light), page)

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
                <ThemeSwitch dark />
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
