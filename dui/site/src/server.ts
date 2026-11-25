// The site: its routes, served by Effect's HTTP router on Bun, behind Caddy (see cli/deploy.ts).
// Pages are rendered once, when it starts, in both schemes.
import { BunHttpServer, BunRuntime } from '@effect/platform-bun'
import { Effect, Layer } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'

import packageJson from '../package.json' with { type: 'json' }
import installSh from '../public/install.sh' with { type: 'text' }
import type { Html } from './lib/jsx/jsx-runtime.ts'
import { lightPage, SITE_URL } from './pages/layout.tsx'
import {
  ComponentList,
  ComponentPage,
  Home,
  Installation,
  Introduction,
  NotFound,
} from './pages/pages.tsx'
import { PUBLIC_FILES } from './public.ts'
import { components, registry, registryJson, SOURCES } from './registry.ts'

// A page, light if the header's switch set the `theme=light` cookie, and dark otherwise.
const html = (page: Html, status = 200) => {
  let response = (value: string) =>
    HttpServerResponse.text(value, {
      status,
      contentType: 'text/html; charset=utf-8',
      headers: { vary: 'cookie' },
    })
  let dark = response(page.value)
  let light = response(lightPage(page.value))
  return Effect.map(HttpServerRequest.HttpServerRequest, (request) =>
    request.cookies.theme === 'light' ? light : dark,
  )
}

const notFound = html(NotFound(), 404)

// A response that's the same every time. Routes take effects: a bare response types as `any`.
const always = (response: HttpServerResponse.HttpServerResponse) => Effect.succeed(response)

// Every page, for the sitemap.
const PAGES = [
  '/',
  '/docs',
  '/docs/installation',
  '/docs/components',
  ...components.map((c) => `/docs/components/${c.name}`),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join('\n')}
</urlset>
`

const component = Effect.gen(function* () {
  let { name } = yield* HttpRouter.params
  let item = components.find((c) => c.name === name)
  return yield* item ? html(ComponentPage({ item })) : notFound
})

// /r/index.json lists the registry; /r/<name>.json is one item, with its files.
const registryItem = Effect.gen(function* () {
  let { file = '' } = yield* HttpRouter.params
  if (file === 'index.json') {
    return yield* HttpServerResponse.json(registry.map(({ files, ...item }) => item))
  }
  let item = registry.find((i) => `${i.name}.json` === file)
  if (!item) return yield* notFound
  return yield* HttpServerResponse.json(registryJson(item))
})

// The code dui adds, at its path in a project, like /ui/button.css: CSS as a stylesheet, the
// rest as text.
const sourceFile = (path: string, source: string) =>
  HttpServerResponse.text(source, {
    contentType: path.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/plain; charset=utf-8',
    headers: { 'access-control-allow-origin': '*' },
  })

// Anything else is the code dui adds, one of PUBLIC_FILES, or not found.
const publicFile = Effect.gen(function* () {
  let { url } = yield* HttpServerRequest.HttpServerRequest
  let pathname = new URL(url, 'http://localhost').pathname
  let source = SOURCES[pathname.slice(1)]
  if (source !== undefined) return sourceFile(pathname, source)
  let path = PUBLIC_FILES[pathname]
  if (!path) return yield* notFound
  let file = Bun.file(path)
  let bytes = yield* Effect.promise(() => file.bytes())
  return HttpServerResponse.uint8Array(bytes, { contentType: file.type })
})

const Routes = HttpRouter.addAll([
  HttpRouter.route('GET', '/', html(Home())),
  HttpRouter.route('GET', '/docs', html(Introduction())),
  HttpRouter.route('GET', '/docs/installation', html(Installation())),
  HttpRouter.route('GET', '/docs/components', html(ComponentList())),
  HttpRouter.route('GET', '/docs/components/:name', component),
  // An example form posted with Datastar off: back to the page, with nothing kept.
  HttpRouter.route(
    'POST',
    '/docs/components/:name',
    Effect.gen(function* () {
      let { name } = yield* HttpRouter.params
      return HttpServerResponse.redirect(`/docs/components/${encodeURIComponent(name ?? '')}`, {
        status: 303,
      })
    }),
  ),
  HttpRouter.route('GET', '/r/:file', registryItem),
  // The installer, for this version of dui, the latest.
  HttpRouter.route(
    'GET',
    '/install.sh',
    always(
      HttpServerResponse.text(installSh.replace('__DUI_VERSION__', packageJson.version), {
        contentType: 'text/plain; charset=utf-8',
      }),
    ),
  ),
  HttpRouter.route(
    'GET',
    '/sitemap.xml',
    always(HttpServerResponse.text(sitemap, { contentType: 'application/xml' })),
  ),
  HttpRouter.route('GET', '*', publicFile),
])

// Serves the site until it's stopped.
export function serve(port: number, hostname: string) {
  console.log(`Serving dui at http://${hostname}:${port}`)
  BunRuntime.runMain(
    Layer.launch(
      HttpRouter.serve(Routes).pipe(Layer.provide(BunHttpServer.layer({ port, hostname }))),
    ),
  )
}
