// The CLI, run in new projects: what init and add write, what they keep, and that a theme from
// before 0.3.0 still makes readable destructive controls. Run with `bun test`; the last test needs
// Playwright's Chromium (`bunx playwright install chromium`).
import { afterAll, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import axe from 'axe-core'
import { chromium } from 'playwright'

import { set } from './jsonc.ts'

const MAIN = join(import.meta.dir, 'main.ts')
const roots: string[] = []
afterAll(() => roots.forEach((root) => rmSync(root, { recursive: true, force: true })))

// A new project: package.json, a src/ folder, and these files in it.
function project(files: Record<string, string> = {}) {
  let root = mkdtempSync(join(tmpdir(), 'dui-test-'))
  roots.push(root)
  files = { 'package.json': '{\n  "name": "app"\n}\n', ...files }
  mkdirSync(join(root, 'src'))
  for (let [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), content)
  }
  let dui = (...args: string[]) => {
    let result = Bun.spawnSync(['bun', MAIN, ...args], { cwd: root })
    return { code: result.exitCode, out: result.stdout.toString() + result.stderr.toString() }
  }
  let read = (path: string) => readFileSync(join(root, path), 'utf8')
  return { root, dui, read }
}

describe('jsonc', () => {
  test('sets the property, not a comment that looks like it', () => {
    let text = '{\n  "compilerOptions": {\n    // "jsx": "preserve",\n    "strict": true\n  }\n}\n'
    let edited = set(text, ['compilerOptions', 'jsx'], 'react-jsx')
    expect(edited).toContain('// "jsx": "preserve",')
    expect(Bun.JSONC.parse(edited)).toEqual({ compilerOptions: { jsx: 'react-jsx', strict: true } })
  })

  test('replaces a value, and adds missing objects', () => {
    expect(Bun.JSONC.parse(set('{"a": {"b": 1,},}', ['a', 'b'], 'x'))).toEqual({ a: { b: 'x' } })
    expect(Bun.JSONC.parse(set('{}', ['a', 'b'], 'x'))).toEqual({ a: { b: 'x' } })
    expect(Bun.JSONC.parse(set('{ "c": 1 }', ['a', 'b'], 'x'))).toEqual({ a: { b: 'x' }, c: 1 })
  })

  test('refuses to set inside something that is not an object', () => {
    expect(() => set('{"a": []}', ['a', 'b'], 'x')).toThrow("a isn't an object")
  })
})

describe('init', () => {
  test('edits a tsconfig.json whose comments mention jsx', () => {
    let tsconfig =
      '{\n  "compilerOptions": {\n    // "jsx": "preserve",\n    "strict": true\n  }\n}\n'
    let { dui, read } = project({ 'tsconfig.json': tsconfig })
    let { code, out } = dui('init')
    expect(out).toContain('updated  tsconfig.json')
    expect(code).toBe(0)
    expect(read('tsconfig.json')).toContain('// "jsx": "preserve",')
    expect(Bun.JSONC.parse(read('tsconfig.json'))).toEqual({
      compilerOptions: { jsxImportSource: '#jsx', jsx: 'react-jsx', strict: true },
    })
    expect(JSON.parse(read('package.json')).imports).toEqual({ '#jsx/*': './src/lib/jsx/*.ts' })
    expect(dui('init').out).not.toMatch(/wrote|updated/)
  })

  test("writes nothing when it can't update tsconfig.json", () => {
    let { root, dui, read } = project({ 'tsconfig.json': '{ "compilerOptions": [] }\n' })
    let { code, out } = dui('init')
    expect(code).toBe(1)
    expect(out).toContain("couldn't update tsconfig.json")
    expect(read('package.json')).toBe('{\n  "name": "app"\n}\n')
    expect(existsSync(join(root, 'src/lib'))).toBe(false)
  })
})

describe('add', () => {
  test("keeps a ui/styles.ts that dui didn't write, in the preview too", () => {
    let mine = 'export const MINE = 1\n'
    let { dui, read } = project({ 'src/ui/styles.ts': mine })
    let preview = dui('add', 'button', '--dry-run')
    expect(preview.out).toContain('keep     src/ui/styles.ts')
    expect(read('src/ui/styles.ts')).toBe(mine)
    let real = dui('add', 'button')
    expect(real.code).toBe(0)
    expect(real.out).toContain('kept     src/ui/styles.ts')
    expect(read('src/ui/styles.ts')).toBe(mine)
    expect(read('src/ui/button.tsx')).toContain('export function Button')
  })

  test('lists its stylesheets in ui/styles.ts, whatever their names', async () => {
    let { root, dui, read } = project({
      'src/ui/2xl.css': '.two {}',
      'src/ui/a-b.css': '.dash {}',
      'src/ui/a_b.css': '.under {}',
    })
    let preview = dui('add', 'dialog', '--dry-run')
    expect(preview.out).toContain('write    src/ui/styles.ts')
    expect(dui('add', 'dialog').code).toBe(0)
    let { DUI_CSS } = (await import(join(root, 'src/ui/styles.ts'))) as { DUI_CSS: string }
    for (let css of ['.two {}', '.dash {}', '.under {}', read('src/ui/button.css')]) {
      expect(DUI_CSS).toContain(css)
    }
    expect(DUI_CSS.startsWith(read('src/lib/theme.css'))).toBe(true)
    // It rewrites its own file as components are added.
    expect(dui('add', 'badge').out).toContain('updated  src/ui/styles.ts')
    expect(read('src/ui/styles.ts')).toContain('./badge.css')
  })

  test("--overwrite replaces the named component, not the theme it's using", () => {
    let { root, dui, read } = project()
    dui('init')
    dui('add', 'dialog')
    for (let file of ['src/lib/theme.css', 'src/ui/button.css', 'src/ui/dialog.css']) {
      writeFileSync(join(root, file), read(file) + '/* mine */\n')
    }
    let { out } = dui('add', 'dialog', '--overwrite')
    expect(out).toContain('replaced src/ui/dialog.css')
    expect(read('src/ui/dialog.css')).not.toContain('/* mine */')
    expect(read('src/ui/button.css')).toContain('/* mine */')
    expect(read('src/lib/theme.css')).toContain('/* mine */')
  })
})

describe('upgrading from 0.2', () => {
  test('a customized 0.2 theme keeps its edits, and destructive controls stay readable', async () => {
    let { root, dui, read } = project()
    dui('init')
    dui('add', 'button', 'badge')
    // 0.2's theme had no --destructive-solid tokens; this one's been customized, too.
    let old = read('src/lib/theme.css')
      .replace(/^ *\/\* Destructive text[\s\S]*?--destructive-solid-foreground: [^;]+;\n/m, '')
      .replace('--radius: 0.625rem;', '--radius: 0;')
    expect(old).not.toContain('--destructive-solid')
    writeFileSync(join(root, 'src/lib/theme.css'), old)
    writeFileSync(join(root, 'src/ui/button.css'), '/* 0.2 */')
    let { out } = dui('add', 'button', 'badge', '--overwrite')
    expect(out).toContain('replaced src/ui/button.css')
    expect(out).toContain('kept     src/lib/theme.css')
    expect(read('src/lib/theme.css')).toBe(old)

    let css = [read('src/lib/theme.css'), read('src/ui/button.css'), read('src/ui/badge.css')]
    let browser = await chromium.launch()
    try {
      let page = await browser.newPage()
      for (let scheme of ['light', 'dark']) {
        await page.setContent(`<!DOCTYPE html><html class="${scheme}"><head>
          <style>${css.join('\n')}</style></head><body>
          <button data-slot="button" data-variant="destructive">Delete</button>
          <span data-slot="badge" data-variant="destructive">Failed</span></body></html>`)
        await page.addScriptTag({ content: axe.source })
        let result = await page.evaluate(() =>
          (window as unknown as { axe: typeof axe }).axe.run(document, {
            runOnly: ['color-contrast'],
          }),
        )
        expect(result.violations).toEqual([])
        // Filled, as the destructive variants are, not see-through with inherited text.
        let fills = await page.$$eval('[data-variant=destructive]', (els) =>
          els.map((el) => getComputedStyle(el).backgroundColor),
        )
        expect(fills).not.toContain('rgba(0, 0, 0, 0)')
        expect(result.passes.flatMap((r) => r.nodes).length).toBe(2)
      }
    } finally {
      await browser.close()
    }
  }, 30000)
})
