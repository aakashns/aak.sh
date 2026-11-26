// The real application and bundled assets, with explicit disposable configuration. This entry
// point never reads AppConfig.layer or .env. All app data stays in the test-owned directory.
import { BunRuntime } from '@effect/platform-bun'
import { Context, Effect, Layer, Redacted } from 'effect'
import { HttpServer } from 'effect/http'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

import { AppConfig } from '../src/lib/config.ts'
import { PublicNetwork } from '../src/lib/public-http.ts'
import { makeServer } from '../src/server.ts'

const [directory, password, secret] = process.argv.slice(2)
if (!directory || !password || !secret)
  throw new Error('Use the browser fixture to start this server')
const config = Layer.succeed(
  AppConfig,
  AppConfig.of({
    port: 0,
    hostname: '127.0.0.1',
    mode: 'test',
    trustProxy: false,
    databasePath: join(directory, 'app.sqlite'),
    mediaStorage: 'fs',
    mediaDir: join(directory, 'media'),
    cacheDir: join(directory, 'cache'),
    adminPassword: Redacted.make(password),
    sessionSecret: Redacted.make(secret),
  }),
)

// Other sites are a fake: every page is HTML titled with its path. A page under /held/ is sent
// once the fixture writes `release <path>` to stdin. `FETCH <path>` is logged as each is asked for.
const held = new Map<string, PromiseWithResolvers<void>>()
const gate = (path: string) => {
  let release = held.get(path) ?? Promise.withResolvers<void>()
  held.set(path, release)
  return release
}
createInterface({ input: process.stdin }).on('line', (line) => {
  if (line.startsWith('release ')) gate(line.slice('release '.length)).resolve()
})
const network = Layer.succeed(
  PublicNetwork,
  PublicNetwork.of({
    resolve: async () => ['93.184.215.14'],
    fetch: async (url) => {
      console.log(`FETCH ${url.pathname}`)
      if (url.pathname.startsWith('/held/')) await gate(url.pathname).promise
      return new Response(`<title>Page ${url.pathname}</title>`, {
        headers: { 'content-type': 'text/html' },
      })
    },
  }),
)

const server = makeServer(network).pipe(
  Layer.provide(config),
  Layer.tap((context) =>
    Effect.sync(() => {
      console.log(
        `READY ${HttpServer.formatAddress(Context.get(context, HttpServer.HttpServer).address)}`,
      )
    }),
  ),
)
BunRuntime.runMain(Layer.launch(server))
