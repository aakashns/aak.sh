import { describe, expect, it, spyOn } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Clock, Duration, Effect, FileSystem } from 'effect'

import { defined, makeTestApp } from '../../../test/app.ts'
import { TEST_CONTENT_DIR } from '../../../test/seed.ts'
import { Images } from '../../lib/images.ts'
import { isPublicAddress, type PublicNetwork } from '../../lib/public-http.ts'
import { LinkPreviews } from './link-previews.ts'

const html = (body = '<title>A public page</title>') =>
  new Response(body, { headers: { 'content-type': 'text/html' } })
const redirect = (location: string) => new Response(null, { status: 302, headers: { location } })
const post = (caption: string) => ({
  id: 'preview001',
  type: 'text' as const,
  caption,
  date: '2026-10-24',
})

async function harness(network: PublicNetwork['Service']) {
  let dir = await mkdtemp(join(tmpdir(), 'logspace-preview-'))
  let app = makeTestApp({ cacheDir: dir }, { network })
  await app.seedDatabase()
  let previews = await app.run(LinkPreviews)
  let fs = await app.run(FileSystem.FileSystem)
  let rename = fs.rename
  let writes = 0
  let waiters: { count: number; resolve: () => void }[] = []
  let mock = spyOn(fs, 'rename').mockImplementation((from, to) =>
    rename(from, to).pipe(
      Effect.tap(
        Effect.sync(() => {
          if (to === join(dir, 'link-previews.json')) {
            writes++
            for (let waiter of waiters) if (writes >= waiter.count) waiter.resolve()
          }
        }),
      ),
    ),
  )
  let written = (count: number) =>
    writes >= count
      ? Promise.resolve()
      : new Promise<void>((resolve) => waiters.push({ count, resolve }))
  return {
    app,
    previews,
    written,
    start: (url: string) => app.run(previews.forPost(post(url))),
    read: (url: string) => app.run(previews.forPost(post(url))),
    dispose: async () => {
      await app.dispose()
      mock.mockRestore()
      await rm(dir, { recursive: true, force: true })
    },
  }
}

describe('public destination policy', () => {
  it('refuses non-public IPv4/IPv6, mapped and transition addresses', () => {
    for (let address of [
      '0.0.0.0',
      '10.1.2.3',
      '100.64.0.1',
      '127.0.0.1',
      '169.254.169.254',
      '172.16.0.1',
      '192.168.0.1',
      '192.0.0.1',
      '192.0.2.1',
      '198.18.0.1',
      '198.51.100.1',
      '203.0.113.1',
      '224.0.0.1',
      '255.255.255.255',
      '::',
      '::1',
      '::ffff:127.0.0.1',
      '::ffff:8.8.8.8',
      'fc00::1',
      'fe80::1',
      'fe80::1%en0',
      'ff02::1',
      '64:ff9b::7f00:1',
      '2001::1',
      '2001:db8::1',
      '2002:7f00:1::1',
      '3fff::1',
      'invalid',
    ])
      expect(isPublicAddress(address)).toBe(false)
    for (let address of [
      '1.1.1.1',
      '8.8.8.8',
      '93.184.215.14',
      '2606:4700:4700::1111',
      '2001:4860:4860::8888',
    ]) {
      expect(isPublicAddress(address)).toBe(true)
    }
  })

  it('runs real background previews in test mode, pins public DNS and follows relative redirects with the origin intact', async () => {
    let calls: {
      url: string
      host: string | null
      tls: string | undefined
      proxy: unknown
      redirect: unknown
    }[] = []
    let resolved: string[] = []
    let h = await harness({
      resolve: async (host) => {
        resolved.push(host)
        return ['93.184.215.14']
      },
      fetch: async (url, options) => {
        calls.push({
          url: url.href,
          host: new Headers(options.headers).get('host'),
          tls: options.tls?.serverName,
          proxy: options.proxy,
          redirect: options.redirect,
        })
        return url.pathname === '/start' ? redirect('/next/page') : html('<title>Allowed</title>')
      },
    })
    try {
      await h.start('https://public.example/start')
      await h.written(1)
      expect((await h.read('https://public.example/start'))?.title).toBe('Allowed')
      expect(resolved).toEqual(['public.example', 'public.example'])
      expect(calls).toEqual(
        ['/start', '/next/page'].map((path) => ({
          url: `https://93.184.215.14${path}`,
          host: 'public.example',
          tls: 'public.example',
          proxy: false,
          redirect: 'manual',
        })),
      )
    } finally {
      await h.dispose()
    }
  })

  it('never connects to local literals, odd IPv4 spellings, private DNS, mixed DNS, credentials, or nonstandard ports', async () => {
    let calls = 0
    let h = await harness({
      resolve: async (host) =>
        host === 'mixed.example' ? ['93.184.215.14', '::1'] : ['127.0.0.1'],
      fetch: async () => {
        calls++
        return html()
      },
    })
    try {
      let urls = [
        'http://127.0.0.1/private',
        'http://2130706433/private',
        'http://0x7f000001/private',
        'http://[::1]/private',
        'http://[::ffff:127.0.0.1]/private',
        'http://localhost/private',
        'http://private.example/private',
        'https://mixed.example/private',
        'https://user:pass@public.example/private',
        'https://public.example:8443/private',
      ]
      for (let [i, url] of urls.entries()) {
        await h.start(url)
        await h.written(i + 1)
        expect((await h.read(url))?.title).toBeUndefined()
      }
      expect(calls).toBe(0)
    } finally {
      await h.dispose()
    }
  })

  it('rechecks redirects and DNS changes, refusing private targets before any second connection', async () => {
    for (let target of ['http://127.0.0.1/private', 'https://[::1]/private', '/private']) {
      let lookups = 0
      let calls = 0
      let h = await harness({
        resolve: async () => (++lookups === 1 ? ['93.184.215.14'] : ['10.0.0.1']),
        fetch: async () => {
          calls++
          return redirect(target)
        },
      })
      try {
        await h.start('https://public.example/start')
        await h.written(1)
        expect((await h.read('https://public.example/start'))?.title).toBeUndefined()
        expect(calls).toBe(1)
      } finally {
        await h.dispose()
      }
    }
  })

  it('refuses an HTTPS downgrade even after an initial HTTP upgrade', async () => {
    let calls = 0
    let h = await harness({
      resolve: async () => ['1.1.1.1'],
      fetch: async () => {
        calls++
        return redirect(
          calls === 1 ? 'https://public.example/secure' : 'http://public.example/plain',
        )
      },
    })
    try {
      await h.start('http://public.example/start')
      await h.written(1)
      expect(calls).toBe(2)
      expect((await h.read('http://public.example/start'))?.title).toBeUndefined()
    } finally {
      await h.dispose()
    }
  })

  it('refuses private image URLs and image redirects while retaining the page title', async () => {
    for (let privateDirect of [true, false]) {
      let calls: string[] = []
      let h = await harness({
        resolve: async () => ['93.184.215.14'],
        fetch: async (url) => {
          calls.push(url.pathname)
          return url.pathname === '/page'
            ? html(
                `<title>Safe title</title><meta property="og:image" content="${privateDirect ? 'https://127.0.0.1/private' : '/image'}">`,
              )
            : redirect('https://169.254.169.254/private')
        },
      })
      try {
        await h.start('https://public.example/page')
        await h.written(1)
        let result = await h.read('https://public.example/page')
        expect(result?.title).toBe('Safe title')
        expect(result?.image).toBeUndefined()
        expect(calls).toEqual(privateDirect ? ['/page'] : ['/page', '/image'])
      } finally {
        await h.dispose()
      }
    }
  })

  it('fetches and re-encodes a public image, resolving relative metadata against the final page', async () => {
    let bytes = await Bun.file(`${TEST_CONTENT_DIR}/posts/t83tytis1i/cover.jpg`).bytes()
    let paths: string[] = []
    let h = await harness({
      resolve: async () => ['2606:4700:4700::1111'],
      fetch: async (url, options) => {
        expect(url.hostname).toBe('[2606:4700:4700::1111]')
        expect(options.tls?.serverName).toBe('public.example')
        paths.push(url.pathname)
        if (url.pathname === '/start') return redirect('/dir/page')
        if (url.pathname === '/dir/page')
          return html('<title>With image</title><meta property="og:image" content="photo.jpg">')
        return new Response(bytes, { headers: { 'content-type': 'image/jpeg' } })
      },
    })
    try {
      await h.start('https://public.example/start')
      await h.written(1)
      let result = await h.read('https://public.example/start')
      expect(paths).toEqual(['/start', '/dir/page', '/dir/photo.jpg'])
      let src = defined(result?.image?.src, 'saved image')
      let response = await h.app.fetch(src)
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('image/webp')
      expect(result?.title).toBe('With image')
    } finally {
      await h.dispose()
    }
  })

  it('shows a link as loading until its card is fetched, which `card` waits for', async () => {
    let bytes = await Bun.file(`${TEST_CONTENT_DIR}/posts/t83tytis1i/cover.jpg`).bytes()
    let page = Promise.withResolvers<void>()
    let h = await harness({
      resolve: async () => ['1.1.1.1'],
      fetch: async (url) => {
        if (url.pathname === '/photo.jpg') {
          return new Response(bytes, { headers: { 'content-type': 'image/jpeg' } })
        }
        await page.promise
        return html('<title>Waited</title><meta property="og:image" content="/photo.jpg">')
      },
    })
    try {
      let url = 'https://public.example/waited'
      let loading = await h.start(url)
      expect(loading).toMatchObject({ domain: 'public.example', loading: true })
      expect(loading?.title).toBeUndefined()
      // The card joins the fetch the preview started.
      let card = h.app.run(h.previews.card(url))
      page.resolve()
      let result = await card
      expect(result).toMatchObject({ title: 'Waited', loading: false })
      expect(result.image?.src).toBeDefined()
      expect(await h.read(url)).toMatchObject({ title: 'Waited', loading: false })
    } finally {
      await h.dispose()
    }
  })

  it('makes a card wait for a free fetch, and gives up on it at its deadline', async () => {
    let held = new Map<string, PromiseWithResolvers<void>>()
    let started = Promise.withResolvers<void>()
    let h = await harness({
      resolve: async () => ['1.1.1.1'],
      fetch: async (url, options) => {
        if (!url.pathname.startsWith('/held/')) return html(`<title>${url.pathname}</title>`)
        let release = Promise.withResolvers<void>()
        held.set(url.pathname, release)
        if (held.size === 4) started.resolve()
        options.signal?.addEventListener('abort', () => release.reject(new Error('aborted')))
        await release.promise
        return html(`<title>${url.pathname}</title>`)
      },
    })
    let deadline = Promise.withResolvers<void>()
    let clock = Effect.runSync(Clock.Clock)
    let cardClock: Clock.Clock = {
      ...clock,
      currentTimeMillisUnsafe: () => clock.currentTimeMillisUnsafe(),
      currentTimeNanosUnsafe: () => clock.currentTimeNanosUnsafe(),
      monotonicTimeNanosUnsafe: () => clock.monotonicTimeNanosUnsafe(),
      sleep: (duration) =>
        Duration.toMillis(duration) === 15_000
          ? Effect.promise(() => deadline.promise)
          : clock.sleep(duration),
    }
    try {
      for (let i = 0; i < 4; i++) await h.start(`https://public.example/held/${i}`)
      await started.promise
      // All four fetches are busy: the fifth link waits for one, and is fetched when it's free.
      expect(await h.start('https://public.example/fifth')).toMatchObject({ loading: true })
      let fifth = h.app.run(h.previews.card('https://public.example/fifth'))
      held.get('/held/0')?.resolve()
      expect(await fifth).toMatchObject({ title: '/fifth', loading: false })
      // Busy again, until the deadline: the card is just the link's domain.
      await h.start('https://public.example/held/4')
      let sixth = h.app.run(
        h.previews
          .card('https://public.example/sixth')
          .pipe(Effect.provideService(Clock.Clock, cardClock)),
      )
      deadline.resolve()
      let expired = await sixth
      expect(expired).toMatchObject({ domain: 'public.example', loading: false })
      expect(expired.title).toBeUndefined()
    } finally {
      await h.dispose()
    }
  })

  it('caps redirect chains and HTML bytes', async () => {
    let calls = 0
    let h = await harness({
      resolve: async () => ['1.1.1.1'],
      fetch: async (url) => {
        calls++
        return url.pathname === '/loop'
          ? redirect('/loop')
          : html(' '.repeat(512 * 1024) + '<title>Too late</title>')
      },
    })
    try {
      await h.start('https://public.example/loop')
      await h.written(1)
      expect(calls).toBe(6)
      await h.start('https://public.example/huge')
      await h.written(2)
      expect((await h.read('https://public.example/huge'))?.title).toBeUndefined()
    } finally {
      await h.dispose()
    }
  })

  for (let limit of ['bytes', 'pixels'] as const) {
    it(`refuses oversized image ${limit} before resizing`, async () => {
      let h = await harness({
        resolve: async () => ['1.1.1.1'],
        fetch: async (url) =>
          url.pathname === '/page'
            ? html('<meta property="og:image" content="/image">')
            : new Response(new Uint8Array(limit === 'bytes' ? 10 * 1024 * 1024 + 1 : 10), {
                headers: { 'content-type': 'image/png' },
              }),
      })
      let images = await h.app.run(Images)
      let read = spyOn(images, 'readInfo').mockImplementation(() =>
        Effect.succeed({ width: 6000, height: 6000, version: 'abc' }),
      )
      let resize = spyOn(images, 'resize')
      try {
        await h.start('https://public.example/page')
        await h.written(1)
        expect((await h.read('https://public.example/page'))?.image).toBeUndefined()
        expect(read.mock.calls.length).toBe(limit === 'bytes' ? 0 : 1)
        expect(resize.mock.calls.length).toBe(0)
      } finally {
        read.mockRestore()
        resize.mockRestore()
        await h.dispose()
      }
    })
  }

  it('times out a stalled fetch at five seconds and aborts its transport', async () => {
    let expire = Promise.withResolvers<void>()
    let started = Promise.withResolvers<void>()
    let aborted = false
    let h = await harness({
      resolve: async () => ['1.1.1.1'],
      fetch: async (_url, options) => {
        started.resolve()
        return new Promise<Response>((_resolve, reject) =>
          options.signal?.addEventListener(
            'abort',
            () => {
              aborted = true
              reject(new Error('aborted'))
            },
            { once: true },
          ),
        )
      },
    })
    let baseClock = Effect.runSync(Clock.Clock)
    let clock: Clock.Clock = {
      currentTimeMillisUnsafe: () => baseClock.currentTimeMillisUnsafe(),
      currentTimeMillis: baseClock.currentTimeMillis,
      currentTimeNanosUnsafe: () => baseClock.currentTimeNanosUnsafe(),
      currentTimeNanos: baseClock.currentTimeNanos,
      monotonicTimeNanosUnsafe: () => baseClock.monotonicTimeNanosUnsafe(),
      monotonicTimeNanos: baseClock.monotonicTimeNanos,
      sleep: (duration) => {
        expect(Duration.toMillis(duration)).toBe(5000)
        return Effect.promise(() => expire.promise)
      },
    }
    try {
      await h.app.run(
        h.previews
          .forPost(post('https://public.example/stalled'))
          .pipe(Effect.provideService(Clock.Clock, clock)),
      )
      await started.promise
      expire.resolve()
      await h.written(1)
      expect(aborted).toBe(true)
      expect((await h.read('https://public.example/stalled'))?.title).toBeUndefined()
    } finally {
      expire.resolve()
      await h.dispose()
    }
  })

  it('admits only four background requests, coalesces duplicate URLs, and cancels them on shutdown', async () => {
    let calls = 0
    let entered = Promise.withResolvers<void>()
    let aborted = 0
    let h = await harness({
      resolve: async () => ['1.1.1.1'],
      fetch: async (_url, options) => {
        calls++
        if (calls === 4) entered.resolve()
        return new Promise<Response>((_resolve, reject) =>
          options.signal?.addEventListener(
            'abort',
            () => {
              aborted++
              reject(new Error('aborted'))
            },
            { once: true },
          ),
        )
      },
    })
    try {
      for (let i = 0; i < 20; i++) await h.start(`https://public.example/${i}`)
      await h.start('https://public.example/0')
      await entered.promise
      expect(calls).toBe(4)
    } finally {
      await h.dispose()
    }
    expect(aborted).toBe(4)
  })
})
