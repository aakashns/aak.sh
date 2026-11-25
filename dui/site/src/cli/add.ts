// `dui add <component...>` copies components into the project's ui/ folder, and what they share
// into lib/, as shadcn/ui's CLI does, then lists every stylesheet in ui/styles.ts. `dui diff`
// shows how the project's copies differ from dui's, and `dui list` lists the components.
//
// The components are the ones this binary was built with (../registry.ts), so a version of dui
// always adds the same code. DUI_REGISTRY fetches them from another site instead, like a dev
// server's /r.
import { existsSync, readdirSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, normalize } from 'node:path'

import packageJson from '../../package.json' with { type: 'json' }
import { registry, registryJson } from '../registry.ts'

const REGISTRY = process.env.DUI_REGISTRY

interface Item {
  name: string
  description: string
  registryDependencies: string[]
  files: { path: string; content: string }[]
}

export interface Options {
  dir?: string | undefined
  overwrite?: boolean | undefined
  dryRun?: boolean | undefined
}

// Where ui/ and lib/ go: --dir, or src/ if there is one, or else here.
export const sourceDir = (options: Options) => options.dir ?? (existsSync('src') ? 'src' : '.')

async function fetchJson<T>(name: string): Promise<T> {
  let response = await fetch(`${REGISTRY}/${name}.json`)
  if (response.status === 404) throw new Error(`Not a component: ${name} (see \`dui list\`)`)
  if (!response.ok) throw new Error(`${response.url}: ${response.status}`)
  return (await response.json()) as T
}

async function getItem(name: string): Promise<Item> {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Not a component: ${name}`)
  if (REGISTRY) return fetchJson<Item>(name)
  let item = registry.find((i) => i.name === name)
  if (!item) throw new Error(`Not a component: ${name} (see \`dui list\`)`)
  return registryJson(item)
}

// The components, and what they need, each once.
async function resolve(names: string[]) {
  let items = new Map<string, Item>()
  for (let queue = [...names]; queue.length;) {
    let name = queue.shift()!
    if (items.has(name)) continue
    let item = await getItem(name)
    items.set(name, item)
    queue.push(...item.registryDependencies)
  }
  return items
}

function target(dir: string, path: string) {
  let file = normalize(path)
  if (isAbsolute(file) || file.startsWith('..')) throw new Error(`Bad path: ${path}`)
  return join(dir, file)
}

const read = (path: string) => (existsSync(path) ? readFile(path, 'utf8') : undefined)

// What add does to each file, and how it says so, before and after.
const VERBS = {
  write: ['write   ', 'wrote   '],
  update: ['update  ', 'updated '],
  replace: ['replace ', 'replaced'],
  same: ['same    ', 'same    '],
  keep: ['keep    ', 'kept    '],
} as const

interface Step {
  path: string
  content: string
  action: keyof typeof VERBS
  note?: string
}

// Writes the components' files that aren't there yet. A file that's there and differs is the
// project's to keep, unless --overwrite and its component was named: --overwrite on Dialog
// replaces Dialog, not the Button or theme it needs (name them too to replace them). Then it
// writes ui/styles.ts, unless the project has a ui/styles.ts of its own.
export async function add(names: string[], options: Options) {
  let dir = sourceDir(options)
  let items = await resolve(names)
  let requested = new Set(names)
  let kept = new Set<string>()
  let steps: Step[] = []
  for (let item of items.values()) {
    for (let file of item.files) {
      let path = target(dir, file.path)
      let current = await read(path)
      let step: Step = {
        path,
        content: file.content,
        action:
          current === undefined
            ? 'write'
            : current === file.content
              ? 'same'
              : options.overwrite && requested.has(item.name)
                ? 'replace'
                : 'keep',
      }
      if (step.action === 'keep') {
        kept.add(item.name)
        step.note = requested.has(item.name) ? 'yours differs' : `yours differs; ${item.name}`
      }
      steps.push(step)
    }
  }
  let styles = await stylesStep(
    dir,
    steps.filter((s) => s.action === 'write').map((s) => s.path),
  )
  if (styles) steps.push(styles)

  for (let step of steps) {
    let note = step.note ? ` (${step.note})` : ''
    console.log(`  ${VERBS[step.action][options.dryRun ? 0 : 1]} ${step.path}${note}`)
    if (options.dryRun || step.action === 'same' || step.action === 'keep') continue
    await mkdir(dirname(step.path), { recursive: true })
    await writeFile(step.path, step.content)
  }
  if (kept.size) {
    let names = [...kept].join(' ')
    console.log(`
Your copies of some files differ from dui ${packageJson.version}'s, and were kept.
  dui diff ${names}                 shows how
  dui add ${names} --overwrite      replaces them`)
  }
  if (options.dryRun) console.log('\nThat was a dry run: nothing was written.')
}

// Whether package.json maps `#jsx/*`, as `dui init` does.
export const hasJsx = async () => !!(await read('package.json'))?.includes('"#jsx/*"')

// ui/styles.ts starts with this, so add knows it wrote it, and may write it again.
const STYLES_HEADER = '// Written by `dui add`'

// ui/styles.ts: the theme, then every stylesheet in ui/ (with those add is about to write), each
// once and in a fixed order, as one string for a page to inline. A ui/styles.ts that add didn't
// write is the project's, and stays.
async function stylesStep(dir: string, writing: string[]): Promise<Step | undefined> {
  let ui = join(dir, 'ui')
  let sheets = new Set(existsSync(ui) ? readdirSync(ui).filter((f) => f.endsWith('.css')) : [])
  for (let path of writing) {
    if (dirname(path) === ui && path.endsWith('.css')) sheets.add(basename(path))
  }
  if (!sheets.size) return undefined
  let paths = [...sheets].sort().map((file) => `./${file}`)
  if (existsSync(join(dir, 'lib/theme.css')) || writing.includes(join(dir, 'lib/theme.css'))) {
    paths.unshift('../lib/theme.css')
  }
  let content = `${STYLES_HEADER}, which rewrites it: lib/theme.css and every stylesheet in ui/,
// for a page to inline. Add your own CSS after it, so it wins:
//
//   <style>{raw(DUI_CSS + myCss)}</style>
${paths.map((path, i) => `import sheet${i} from ${JSON.stringify(path)} with { type: 'text' }`).join('\n')}

export const DUI_CSS = [${paths.map((_, i) => `sheet${i}`).join(', ')}].join('\\n')
`
  let path = join(ui, 'styles.ts')
  let current = await read(path)
  if (current === undefined) return { path, content, action: 'write' }
  if (current === content) return { path, content, action: 'same' }
  if (current.startsWith(STYLES_HEADER)) return { path, content, action: 'update' }
  return { path, content, action: 'keep', note: "not dui's; import new stylesheets yourself" }
}

// Shows how the project's copies of these components (every one installed, if none are named)
// differ from dui's, as unified diffs.
export async function diff(names: string[], options: Options) {
  let dir = sourceDir(options)
  if (!names.length) {
    let ui = join(dir, 'ui')
    names = existsSync(ui)
      ? readdirSync(ui)
          .filter((file) => file.endsWith('.tsx'))
          .map((file) => file.slice(0, -4))
          .filter((name) => registry.some((i) => i.name === name))
      : []
    if (existsSync(join(dir, 'lib'))) names.push('lib')
    if (!names.length) throw new Error(`No components in ${join(dir, 'ui')} (see --dir)`)
  }
  let tmp = await mkdtemp(join(tmpdir(), 'dui-'))
  let differs = 0
  try {
    for (let name of names) {
      for (let file of (await getItem(name)).files) {
        let path = target(dir, file.path)
        let current = await read(path)
        if (current === undefined) console.log(`${path}: not in the project`)
        if (current === undefined || current === file.content) continue
        differs++
        let theirs = join(tmp, String(differs))
        await writeFile(theirs, file.content)
        let labels = [
          '--label',
          `${path} (yours)`,
          '--label',
          `${path} (dui ${packageJson.version})`,
        ]
        let result = Bun.spawnSync(['diff', '-u', ...labels, path, theirs])
        process.stdout.write(result.stdout)
      }
    }
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
  if (!differs) console.log(`The project's copies match dui ${packageJson.version}'s.`)
}

export async function list() {
  let items = REGISTRY ? await fetchJson<Item[]>('index') : registry
  for (let item of items) {
    if (item.name !== 'lib') console.log(`${item.name.padEnd(14)} ${item.description}`)
  }
}
