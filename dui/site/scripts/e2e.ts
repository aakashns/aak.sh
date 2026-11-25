// Checks dui in Chromium: the quickstart counts clicks, examples keep form values out of URLs,
// tabs work from the keyboard, and the previews' text meets axe's contrast thresholds in both
// schemes. CI runs it on a dev server and on the quickstart in new projects:
//
//   bun scripts/e2e.ts --site http://127.0.0.1:3000 [--quickstart http://127.0.0.1:3001 ...]
//
// SCREENSHOTS=<folder> saves screenshots of what it checks.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

import axe from 'axe-core'
import { chromium, type Page } from 'playwright'

let { values } = parseArgs({
  options: { site: { type: 'string' }, quickstart: { type: 'string', multiple: true } },
})
let site = values.site
let screenshots = process.env.SCREENSHOTS
if (screenshots) mkdirSync(screenshots, { recursive: true })

let failures: string[] = []
function check(ok: boolean, what: string) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`)
  if (!ok) failures.push(what)
}
// Switches the page to a scheme, with transitions off so colors are settled when axe reads them.
async function setScheme(page: Page, scheme: string) {
  await page.addStyleTag({ content: '*, ::before, ::after { transition: none !important }' })
  await page.evaluate(async (scheme) => {
    document.documentElement.className = scheme
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  }, scheme)
}

const shot = (page: Page, name: string) =>
  screenshots ? page.screenshot({ path: join(screenshots, `${name}.png`) }) : undefined

let browser = await chromium.launch()
let page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

for (let url of values.quickstart ?? []) {
  await page.goto(url)
  let button = page.getByRole('button', { name: /Clicked/ })
  await button.click()
  await page.waitForFunction(() => document.body.textContent?.includes('Clicked 1 times'))
  check((await button.textContent())?.replace(/\s+/g, ' ').trim() === 'Clicked 1 times', url)
  await shot(page, 'quickstart')
}

if (site) {
  // A form's values in a URL put them in history and logs.
  let queries: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).search) queries.push(request.url())
  })

  await page.goto(`${site}/docs/components/field`)
  let form = page.locator('form:has(#project-name)')
  let status = form.getByRole('status')
  await page.fill('#project-name', 'Moonbase')
  await page.press('#project-name', 'Enter')
  await status
    .filter({ hasText: 'Saved Moonbase.' })
    .waitFor({ timeout: 2000 })
    .catch(() => {})
  check((await status.textContent()) === 'Saved Moonbase.', 'field: Enter saves')
  await page.fill('#project-name', 'Starbase')
  await form.getByRole('button', { name: 'Save' }).click()
  await status
    .filter({ hasText: 'Saved Starbase.' })
    .waitFor({ timeout: 2000 })
    .catch(() => {})
  check((await status.textContent()) === 'Saved Starbase.', 'field: Save saves')
  await form.scrollIntoViewIfNeeded()
  await shot(page, 'field-saved')
  check(page.url() === `${site}/docs/components/field`, 'field: the page stays put')

  // With JavaScript off, the form posts, and the site sends it back to the page.
  let noScript = await browser.newPage({ javaScriptEnabled: false })
  noScript.on('request', (request) => {
    if (new URL(request.url()).search) queries.push(request.url())
  })
  await noScript.goto(`${site}/docs/components/field`)
  await noScript.fill('#project-name', 'Moonbase')
  await Promise.all([noScript.waitForNavigation(), noScript.press('#project-name', 'Enter')])
  check(noScript.url() === `${site}/docs/components/field`, 'field: without JavaScript, too')
  await noScript.close()
  check(!queries.length, `field: no values in URLs ${queries.join(' ')}`)

  // Tabs: the open tab is the one stop in the Tab order, and the keys move between tabs.
  await page.goto(`${site}/docs/components/tabs`)
  let list = page.getByRole('tablist').first()
  let focused = () => page.evaluate(() => document.activeElement?.textContent?.trim())
  let open = () => list.locator('[aria-selected=true]').textContent()
  let stops = await list.locator('[role=tab][tabindex="0"]').count()
  check(stops === 1, 'tabs: one tab stop')
  await list.getByRole('tab', { name: 'Account' }).focus()
  await page.keyboard.press('ArrowRight')
  check((await focused()) === 'Password' && (await open()) === 'Password', 'tabs: ArrowRight')
  await page.keyboard.press('ArrowRight')
  check((await focused()) === 'Account' && (await open()) === 'Account', 'tabs: wraps around')
  await page.keyboard.press('End')
  check((await focused()) === 'Password', 'tabs: End')
  await page.keyboard.press('Home')
  check((await focused()) === 'Account', 'tabs: Home')
  await page.keyboard.press('Tab')
  let role = await page.evaluate(() => document.activeElement?.getAttribute('role'))
  check(role === 'tabpanel', 'tabs: Tab moves on to the panel')
  check(
    (await list.locator('[role=tab][tabindex="0"]').textContent()) === 'Account',
    'tabs: the open tab is the stop',
  )

  // The header's switch flips the scheme, and the next page load keeps it.
  let schemeNow = () =>
    page.evaluate(() => [
      document.documentElement.className,
      document.querySelector<HTMLMetaElement>('meta[name=theme-color]')?.content,
    ])
  let toggle = page.getByRole('button', { name: 'Toggle theme' })
  await page.goto(`${site}/docs`)
  check(String(await schemeNow()) === 'dark,#000000', 'theme: dark by default')
  await toggle.click()
  check(String(await schemeNow()) === 'light,#ffffff', 'theme: the switch turns it light')
  await page.reload()
  check(String(await schemeNow()) === 'light,#ffffff', 'theme: light after a reload')
  await shot(page, 'theme-light')
  await toggle.click()
  await page.reload()
  check(String(await schemeNow()) === 'dark,#000000', 'theme: and back to dark')

  // Contrast, in both schemes, in every component's previews and highlighted code, and the home
  // page's dashboard.
  let index = (await (await fetch(`${site}/r/index.json`)).json()) as { name: string }[]
  let paths = [
    '/',
    ...index.filter((i) => i.name !== 'lib').map((i) => `/docs/components/${i.name}`),
  ]
  for (let scheme of ['dark', 'light']) {
    for (let path of paths) {
      await page.goto(site + path)
      await setScheme(page, scheme)
      await page.addScriptTag({ content: axe.source })
      let violations = await page.evaluate(async () => {
        let result = await (window as unknown as { axe: typeof axe }).axe.run(
          { include: [['.preview'], ['.showcase'], ['.code pre']] } as axe.ElementContext,
          { runOnly: ['color-contrast'] },
        )
        return result.violations.flatMap((v) =>
          v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary?.split('\n').at(-1)}`),
        )
      })
      check(!violations.length, `contrast, ${scheme}: ${path} ${violations.join('; ')}`)
    }
  }
}

await browser.close()
if (failures.length) {
  console.log(`\n${failures.length} failed`)
  process.exit(1)
}
