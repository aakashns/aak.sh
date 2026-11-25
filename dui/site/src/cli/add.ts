// `dui add <component...>` copies components from dui.aak.sh's registry (see ../registry.ts)
// into the project's ui/ folder, and what they share into lib/, as shadcn/ui's CLI does.
// `dui list` lists them. DUI_REGISTRY points both at another site, like a dev server's /r.
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, normalize } from 'node:path'

const REGISTRY = process.env.DUI_REGISTRY ?? 'https://dui.aak.sh/r'

interface Item {
  name: string
  description: string
  registryDependencies: string[]
  files: { path: string; content: string }[]
}

async function fetchJson<T>(name: string): Promise<T> {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Not a component: ${name}`)
  let response = await fetch(`${REGISTRY}/${name}.json`)
  if (response.status === 404) throw new Error(`Not a component: ${name} (see \`dui list\`)`)
  if (!response.ok) throw new Error(`${response.url}: ${response.status}`)
  return (await response.json()) as T
}

export async function add(names: string[], options: { dir?: string; overwrite?: boolean }) {
  let dir = options.dir ?? (existsSync('src') ? 'src' : '.')
  // The components, and what they need, each once.
  let items = new Map<string, Item>()
  for (let queue = [...names]; queue.length;) {
    let name = queue.shift()!
    if (items.has(name)) continue
    let item = await fetchJson<Item>(name)
    items.set(name, item)
    queue.push(...item.registryDependencies)
  }
  let wroteLib = false
  for (let item of items.values()) {
    for (let file of item.files) {
      let path = normalize(file.path)
      if (isAbsolute(path) || path.startsWith('..')) throw new Error(`Bad path: ${file.path}`)
      let target = join(dir, path)
      if (existsSync(target) && !options.overwrite) {
        console.log(`  skipped ${target} (it exists; --overwrite replaces it)`)
        continue
      }
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, file.content)
      console.log(`  wrote ${target}`)
      if (item.name === 'lib') wroteLib = true
    }
  }
  if (wroteLib) {
    console.log(`
Point JSX at lib/jsx, if you haven't:
  package.json   "imports": { "#jsx/*": "./${join(dir, 'lib/jsx')}/*.ts" }
  tsconfig.json  "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "#jsx" }`)
  }
}

export async function list() {
  for (let item of await fetchJson<Item[]>('index')) {
    if (item.name !== 'lib') console.log(`${item.name.padEnd(10)} ${item.description}`)
  }
}
