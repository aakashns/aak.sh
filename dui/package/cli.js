#!/usr/bin/env node
// `npx @aakashns/dui add button card`: copies components from dui.aak.sh's registry into the
// project's ui/ folder, and what they share into lib/, like shadcn/ui's CLI.
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, normalize } from 'node:path'
import { parseArgs } from 'node:util'

const REGISTRY = process.env.DUI_REGISTRY ?? 'https://dui.aak.sh/r'
const USAGE = `Usage: dui add <component...> [--dir <folder>] [--overwrite]
       dui list

Writes to <folder>/ui and <folder>/lib; <folder> is src if there is one, or else the current folder.`

let { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    dir: { type: 'string' },
    overwrite: { type: 'boolean', short: 'o' },
    help: { type: 'boolean', short: 'h' },
  },
})
let [command, ...names] = positionals

async function fetchItem(name) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Not a component: ${name}`)
  let response = await fetch(`${REGISTRY}/${name}.json`)
  if (response.status === 404) throw new Error(`Not a component: ${name} (see \`dui list\`)`)
  if (!response.ok) throw new Error(`${response.url}: ${response.status}`)
  return response.json()
}

async function add(names) {
  let dir = values.dir ?? (existsSync('src') ? 'src' : '.')
  // The components, and what they need, each once.
  let items = new Map()
  for (let queue = [...names]; queue.length; ) {
    let name = queue.shift()
    if (items.has(name)) continue
    let item = await fetchItem(name)
    items.set(name, item)
    queue.push(...item.registryDependencies)
  }
  let wroteLib = false
  for (let item of items.values()) {
    for (let file of item.files) {
      let path = normalize(file.path)
      if (isAbsolute(path) || path.startsWith('..')) throw new Error(`Bad path: ${file.path}`)
      let target = join(dir, path)
      if (existsSync(target) && !values.overwrite) {
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
    let jsx = `./${join(dir, 'lib/jsx')}/*.ts`
    console.log(`
Point JSX at lib/jsx, if you haven't:
  package.json   "imports": { "#jsx/*": "${jsx}" }
  tsconfig.json  "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "#jsx" }`)
  }
}

async function list() {
  let response = await fetch(`${REGISTRY}/index.json`)
  if (!response.ok) throw new Error(`${response.url}: ${response.status}`)
  for (let item of await response.json()) {
    if (item.name !== 'lib') console.log(`${item.name.padEnd(10)} ${item.description}`)
  }
}

try {
  if (values.help) console.log(USAGE)
  else if (command === 'add' && names.length) await add(names)
  else if (command === 'list') await list()
  else {
    console.error(USAGE)
    process.exitCode = 1
  }
} catch (error) {
  console.error(`dui: ${error.message}`)
  process.exitCode = 1
}
