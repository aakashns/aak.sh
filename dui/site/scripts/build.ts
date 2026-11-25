// Renders every page and registry item to dist/, with public/ as it is, for Caddy to serve.
// A page at /docs/installation is dist/docs/installation.html (see ../Caddyfile).
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { Layer } from 'effect'
import { HttpRouter, HttpServer } from 'effect/http'

import { registry } from '../src/registry.ts'
import { PAGES, Routes } from '../src/server.ts'

const dist = join(import.meta.dir, '../dist')
const files: Record<string, string> = {
  '/sitemap.xml': 'sitemap.xml',
  '/404': '404.html',
  '/r/index.json': 'r/index.json',
}
for (let path of PAGES) files[path] = path === '/' ? 'index.html' : `${path.slice(1)}.html`
for (let item of registry) files[`/r/${item.name}.json`] = `r/${item.name}.json`

let { handler, dispose } = HttpRouter.toWebHandler(
  Routes.pipe(Layer.provide(HttpServer.layerServices)),
  { disableLogger: true },
)
await rm(dist, { recursive: true, force: true })
await cp(join(import.meta.dir, '../public'), dist, { recursive: true })
for (let [path, file] of Object.entries(files)) {
  let response = await handler(new Request(`http://localhost${path}`))
  if (!response.ok && path !== '/404') throw new Error(`${path}: ${response.status}`)
  await mkdir(dirname(join(dist, file)), { recursive: true })
  await writeFile(join(dist, file), await response.text())
}
await dispose()
console.log(`Built ${Object.keys(files).length} files into dist/`)
