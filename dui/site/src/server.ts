// The site: its routes, served by Effect's HTTP router on Bun, behind Caddy (see ../dui.service).
// Pages are rendered once, when it starts.
import { BunHttpServer, BunRuntime } from '@effect/platform-bun'
import { Effect, Layer } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'

import type { Html } from './lib/jsx/jsx-runtime.ts'
import { SITE_URL } from './pages/layout.tsx'
import {
  ComponentList,
  ComponentPage,
  Home,
  Installation,
  Introduction,
  NotFound,
} from './pages/pages.tsx'
import { components, registry, registryJson } from './registry.ts'

const html = (page: Html, status = 200) =>
  HttpServerResponse.text(page.value, { status, contentType: 'text/html; charset=utf-8' })

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
  return item ? html(ComponentPage({ item })) : notFound
})

// /r/index.json lists the registry; /r/<name>.json is one item, with its files.
const registryItem = Effect.gen(function* () {
  let { file = '' } = yield* HttpRouter.params
  if (file === 'index.json') {
    return yield* HttpServerResponse.json(registry.map(({ files, ...item }) => item))
  }
  let item = registry.find((i) => `${i.name}.json` === file)
  if (!item) return notFound
  return yield* HttpServerResponse.json(yield* Effect.promise(() => registryJson(item)))
})

// Anything else is a file in public/, or not found.
const PUBLIC = new URL('../public/', import.meta.url)
const publicFile = Effect.gen(function* () {
  let { url } = yield* HttpServerRequest.HttpServerRequest
  let path = decodeURIComponent(new URL(url, 'http://localhost').pathname).slice(1)
  if (!path || path.split('/').includes('..')) return notFound
  let file = Bun.file(new URL(path, PUBLIC))
  if (!(yield* Effect.promise(() => file.exists()))) return notFound
  let bytes = yield* Effect.promise(() => file.bytes())
  return HttpServerResponse.uint8Array(bytes, { contentType: file.type })
})

const Routes = HttpRouter.addAll([
  HttpRouter.route('GET', '/', always(html(Home()))),
  HttpRouter.route('GET', '/docs', always(html(Introduction()))),
  HttpRouter.route('GET', '/docs/installation', always(html(Installation()))),
  HttpRouter.route('GET', '/docs/components', always(html(ComponentList()))),
  HttpRouter.route('GET', '/docs/components/:name', component),
  HttpRouter.route('GET', '/r/:file', registryItem),
  HttpRouter.route(
    'GET',
    '/sitemap.xml',
    always(HttpServerResponse.text(sitemap, { contentType: 'application/xml' })),
  ),
  HttpRouter.route('GET', '*', publicFile),
])

if (import.meta.main) {
  let port = Number(process.env.PORT ?? 3000)
  let hostname = process.env.HOST ?? '127.0.0.1'
  console.log(`Serving dui at http://${hostname}:${port}`)
  BunRuntime.runMain(
    Layer.launch(
      HttpRouter.serve(Routes).pipe(Layer.provide(BunHttpServer.layer({ port, hostname }))),
    ),
  )
}
