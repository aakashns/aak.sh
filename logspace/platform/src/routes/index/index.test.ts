// The home page, and what every page has.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

import { capture, defined, makeTestApp } from '../../../test/app.ts'
import { PostCommands } from '../../data/posts/commands.ts'
import { PostQueries } from '../../data/posts/queries.ts'
import { toPostRow } from '../../data/posts/rows.ts'
import { newPostEmail } from '../admin/compose/email.tsx'

const app = makeTestApp()
const posts = () => app.run(Effect.flatMap(PostQueries, (queries) => queries.all))

beforeAll(app.seedMedia)
beforeEach(app.seedDatabase)
afterAll(app.dispose)

describe('the home page', () => {
  it('renders every post, newest first', async () => {
    let response = await app.fetch('/')
    let html = await response.text()
    let dates = [...html.matchAll(/<time datetime="([^"]+)"/g)].map(([, date = '']) =>
      Date.parse(date),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
    expect(dates.length).toBe((await posts()).length)
    expect(dates).toEqual(dates.toSorted((a, b) => b - a))
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/example\.com\/"/)
  })

  it('shows the site config’s title, description, and introduction', async () => {
    let html = await (await app.fetch('/')).text()
    expect(html).toMatch(/<title>Test Site<\/title>/)
    expect(html).toMatch(/<meta name="description" content="Posts for testing\.">/)
    expect(html).toMatch(/<meta property="og:site_name" content="Test Site">/)
    expect(html).toMatch(/<h1>Hi, I’m a test!<\/h1><p>I check that things work\.<\/p>/)
  })

  it('preloads the first post’s photo first, and loads Datastar last, at a low priority', async () => {
    let html = await (await app.fetch('/')).text()
    let head = html.slice(0, html.indexOf('</head>'))
    let preload = head.match(/<link rel="preload" as="image"[^>]*>/)?.[0] ?? ''
    // Before the inlined stylesheet, with the same copies and sizes as the photo's <img>.
    expect(preload).not.toBe('')
    expect(head.indexOf(preload)).toBeLessThan(head.indexOf('<style'))
    let img = html.match(/<img [^>]*hike-1\.jpg[^>]*>/)?.[0] ?? ''
    expect(preload.match(/ imagesrcset="([^"]+)"/)?.[1]).toBe(img.match(/ srcset="([^"]+)"/)?.[1])
    expect(preload.match(/ imagesizes="([^"]+)"/)?.[1]).toBe(img.match(/ sizes="([^"]+)"/)?.[1])
    expect(preload).toMatch(/ fetchpriority="high"/)
    // The only script runs nothing until the page has been parsed, and only with the nonce.
    expect(head).not.toMatch(/<script (?!type="application\/ld\+json")/)
    let nonce = html.match(/<html [^>]*data-nonce="([^"]+)"/)?.[1]
    expect(html).toMatch(
      new RegExp(
        `<script type="module" src="/assets/datastar\\.[0-9a-f]{12}\\.js" nonce="${nonce}" fetchpriority="low"></script></body>`,
      ),
    )

    // A post's page preloads its own first photo; a text post has nothing to preload.
    let photos = await (await app.fetch('/posts/drdp3ei6fd')).text()
    expect(photos).toMatch(
      /<link rel="preload" as="image" href="\/posts\/drdp3ei6fd\/hike-1\.jpg\?v=/,
    )
    let text = await (await app.fetch('/posts/xf6ddthtoo')).text()
    expect(text).not.toMatch(/rel="preload" as="image"/)
  })

  it('links to the RSS feed from every page’s head, and with a button below the introduction', async () => {
    let html = await (await app.fetch('/')).text()
    expect(html).toMatch(
      /<link rel="alternate" type="application\/rss\+xml"[^>]*href="https:\/\/example\.com\/rss\.xml"/,
    )
    // With subscribing closed, RSS is the only button.
    expect(html).toMatch(
      /<div class="intro-actions"><a data-slot="button" data-variant="outline"[^>]* href="\/rss\.xml"><svg[^>]*>.*?<\/svg>RSS<\/a><\/div>/,
    )
    // Not in the navbar.
    expect(html).not.toContain('aria-label="RSS feed"')
  })

  it('inlines every page’s styles, with the heading font embedded, and its own', async () => {
    let html = await (await app.fetch('/')).text()
    let style = html.match(/<style>(.*?)<\/style>/s)?.[1] ?? ''
    expect(style).toMatch(/^@layer reset,theme,ui,components;/)
    expect(style).toMatch(/font-family:'Instrument Sans'/)
    expect(style).toMatch(/url\("data:font\/woff2;base64,/)
    expect(style).not.toMatch(/instrument-sans-latin-600\.woff2/)
    expect(style).toMatch(/\.feed-post\{/)
    expect(style).toMatch(/\.banner\{/)
    // Other pages' styles are only on those pages.
    expect(style).not.toMatch(/\.post-page\{/)
    expect(style).not.toMatch(/\.admin-page/)
    expect(html).not.toMatch(/rel="stylesheet"/)
  })

  it('sends security headers, and a CSP that only lets Datastar run, with this response’s nonce', async () => {
    let page = await app.fetch('/')
    let html = await page.text()
    let nonce = html.match(/data-nonce="([^"]+)"/)?.[1]
    expect(page.headers.get('X-Frame-Options')).toBe('DENY')
    expect(page.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
    expect(page.headers.get('Strict-Transport-Security')).toMatch(/max-age=\d+/)
    let csp = page.headers.get('Content-Security-Policy') ?? ''
    expect(csp).toContain(`script-src 'nonce-${nonce}';`)
    expect(csp).toContain("require-trusted-types-for 'script'")
    expect(csp).toContain("frame-ancestors 'none'")
    // A new nonce every time.
    let again = await (await app.fetch('/')).text()
    expect(again.match(/data-nonce="([^"]+)"/)?.[1]).not.toBe(nonce)
  })

  it('caches fonts and Datastar for a year, and runs no scripts in other responses', async () => {
    let html = await (await app.fetch('/')).text()
    let datastar = await app.fetch(capture(html, /src="(\/assets\/datastar\.[^"]+)"/))
    expect(datastar.status).toBe(200)
    expect(datastar.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8')
    expect(datastar.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    let font = await app.fetch('/fonts/instrument-sans-latin-ext-600.woff2')
    expect(font.status).toBe(200)
    expect(font.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(font.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(font.headers.get('Content-Security-Policy')).toContain("script-src 'none'")
    expect((await app.fetch('/assets/datastar.000000000000.js')).status).toBe(404)
  })

  it('wraps user content so Datastar ignores it, and keeps expressions free of it', async () => {
    let id = 'xss0000000'
    let caption = 'Hi <b data-on:click="alert(1)">there</b> data-on:click="alert(2)"'
    await app.run(
      Effect.flatMap(PostCommands, (commands) =>
        commands.save(
          {
            post: { id, type: 'text', date: '2000-01-01T00:00:00Z', caption },
            uploads: [],
            issues: [],
          },
          newPostEmail,
        ),
      ),
    )
    let html = await (await app.fetch(`/posts/${id}`)).text()
    expect(html).toContain(
      '<div class="caption" data-ignore><p>Hi &lt;b data-on:click="alert(1)"&gt;there&lt;/b&gt;',
    )
    expect(html).not.toMatch(/<b data-on/)
  })
})

describe('the feed’s pages', () => {
  // 116 text posts older than the 4 samples, so 120 in all: pages of 50, 50, and 20. They're
  // posted three to a second, so the first page ends partway through a second's posts.
  let addPosts = () =>
    app.run(
      Effect.gen(function* () {
        let sql = yield* SqlClient.SqlClient
        let rows = Array.from({ length: 116 }, (_, index) =>
          toPostRow({
            id: `p${String(index).padStart(9, '0')}`,
            type: 'text',
            date: new Date(Date.UTC(2020, 0, 1) - Math.floor(index / 3) * 1000)
              .toISOString()
              .replace('.000', ''),
            caption: `Post ${index}`,
          }),
        )
        yield* sql`insert into posts ${sql.insert(rows.map((row) => ({ ...row })))}`
      }).pipe(Effect.orDie),
    )
  let ids = (html: string) =>
    [...html.matchAll(/<a href="\/posts\/(\w+)" aria-hidden="true"/g)].map(([, id = '']) => id)
  let link = (html: string, rel: 'prev' | 'next') =>
    new RegExp(`href="([^"]+)" rel="${rel}"`).exec(html)?.[1]

  it('shows 50 posts a page, linking to older and newer pages by cursor', async () => {
    await addPosts()
    let all = (await posts()).map((post) => post.id)
    expect(all).toHaveLength(120)

    let home = await (await app.fetch('/')).text()
    expect(ids(home)).toEqual(all.slice(0, 50))
    expect(link(home, 'prev')).toBeUndefined()
    // The last post on the page shares its second with the first on the next.
    expect(link(home, 'next')).toBe('/?before=20191231235945-p000000047')
    expect(home).toContain('Older posts')
    expect(home).not.toContain('Newer posts')

    let second = await (await app.fetch('/?before=20191231235945-p000000047')).text()
    expect(ids(second)).toEqual(all.slice(50, 100))
    expect(link(second, 'prev')).toBe('/')
    expect(second).toMatch(/<title>Older posts · Test Site<\/title>/)
    expect(second).toMatch(
      /<link rel="canonical" href="https:\/\/example\.com\/\?before=20191231235945-p000000047"/,
    )

    let third = await (await app.fetch(defined(link(second, 'next'), 'an older page'))).text()
    expect(ids(third)).toEqual(all.slice(100))
    expect(link(third, 'next')).toBeUndefined()
    expect(third).not.toContain('Older posts</a>')

    // Back from the last page is the second again, and back from that is the home page.
    let newer = defined(link(third, 'prev'), 'a newer page')
    expect(newer).toMatch(/^\/\?after=/)
    let again = await (await app.fetch(newer)).text()
    expect(ids(again)).toEqual(all.slice(50, 100))
    expect(link(again, 'prev')).toBe('/')
    expect(link(again, 'next')).toBe(link(second, 'next'))
  })

  it('has no links when every post fits on the home page', async () => {
    let home = await (await app.fetch('/')).text()
    expect(home).not.toContain('class="pagination"')
  })

  it('sends pages a cursor no longer leads to home, and rejects ones that aren’t cursors', async () => {
    await addPosts()
    // Nothing's older than the oldest post, and what's newer than the 50th fits on the home page.
    let oldest = '19991231000000-0000000000'
    expect((await app.fetch(`/?before=${oldest}`)).headers.get('Location')).toBe('/')
    expect((await app.fetch('/?after=20191231235945-p000000047')).status).toBe(302)
    expect((await app.fetch('/?after=20191231235945-p000000047')).headers.get('Location')).toBe('/')
    for (let query of ['before=fc7p7vjhx6', 'after=2026']) {
      expect((await app.fetch(`/?${query}`)).status).toBe(404)
    }
    let both = '20191231235945-p000000047'
    expect((await app.fetch(`/?before=${both}&after=${both}`)).status).toBe(404)
  })
})
