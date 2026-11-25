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
import { dirname, isAbsolute, join, normalize } from 'node:path'

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
  replace: ['replace ', 'replaced'],
  same: ['same    ', 'same    '],
  keep: ['keep    ', 'kept    '],
} as const

// Writes the components' files that aren't there yet. A file that's there and differs is the
// project's to keep, unless --overwrite and its component was named: --overwrite on Dialog
// replaces Dialog, not the Button or theme it needs (name them too to replace them).
export async function add(names: string[], options: Options) {
  let dir = sourceDir(options)
  let items = await resolve(names)
  let requested = new Set(names)
  let kept = new Set<string>()
  let changed = false
  for (let item of items.values()) {
    for (let file of item.files) {
      let path = target(dir, file.path)
      let current = await read(path)
      let action: keyof typeof VERBS =
        current === undefined
          ? 'write'
          : current === file.content
            ? 'same'
            : options.overwrite && requested.has(item.name)
              ? 'replace'
              : 'keep'
      let note = ''
      if (action === 'keep') {
        kept.add(item.name)
        note = requested.has(item.name) ? ' (yours differs)' : ` (yours differs; ${item.name})`
      }
      console.log(`  ${VERBS[action][options.dryRun ? 0 : 1]} ${path}${note}`)
      if (options.dryRun || action === 'same' || action === 'keep') continue
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, file.content)
      changed = true
    }
  }
  if (!options.dryRun && (changed || !existsSync(join(dir, 'ui/styles.ts')))) {
    if (await writeStyles(dir)) console.log(`  wrote    ${join(dir, 'ui/styles.ts')}`)
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

// Writes ui/styles.ts: the theme, then every stylesheet in ui/, each once and in a fixed order,
// as one string for a page to inline. Returns whether it changed.
export async function writeStyles(dir: string) {
  let ui = join(dir, 'ui')
  if (!existsSync(ui)) return false
  let sheets = readdirSync(ui)
    .filter((file) => file.endsWith('.css'))
    .sort()
  let imports = sheets.map((file) => {
    let name = file.slice(0, -4).replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    return [`${name}Css`, `./${file}`]
  })
  if (existsSync(join(dir, 'lib/theme.css'))) imports.unshift(['theme', '../lib/theme.css'])
  let code = `// Written by \`dui add\`, which rewrites it: lib/theme.css and every stylesheet in ui/, for
// a page to inline. Add your own CSS after it, so it wins:
//
//   <style>{raw(DUI_CSS + myCss)}</style>
${imports.map(([name, path]) => `import ${name} from '${path}' with { type: 'text' }`).join('\n')}

export const DUI_CSS = [${imports.map(([name]) => name).join(', ')}].join('\\n')
`
  let path = join(ui, 'styles.ts')
  if ((await read(path)) === code) return false
  await writeFile(path, code)
  return true
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
