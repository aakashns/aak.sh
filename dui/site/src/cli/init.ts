// `dui init` sets a Bun project up for dui's components, and running it again changes nothing:
// it adds lib/ (the JSX runtime and the theme) beside where ui/ goes, maps the `#jsx/*` import
// in package.json to lib/jsx, and points tsconfig.json's JSX at it.
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

import { add, sourceDir, type Options } from './add.ts'
import { set } from './jsonc.ts'

const JSX = { jsx: 'react-jsx', jsxImportSource: '#jsx' }

export async function init(options: Options) {
  if (!existsSync('package.json')) {
    throw new Error(
      "there's no package.json here: run dui in your project's folder (or `bun init`)",
    )
  }
  let dir = sourceDir(options)
  // Relative to package.json, like "./src/lib/jsx/*.ts", wherever --dir points.
  let lib = relative('.', resolve(dir, 'lib/jsx')).split(sep).join('/')
  if (lib.startsWith('..')) throw new Error(`--dir must be in this project: ${dir}`)
  let mapping = `./${lib}/*.ts`

  // Every change, worked out and checked before any is written.
  let changes = [
    await plan('package.json', { imports: { '#jsx/*': mapping } }),
    await plan('tsconfig.json', { compilerOptions: JSX }),
  ]

  await add(['lib'], { ...options, overwrite: false })
  for (let { file, before, after } of changes) {
    let [verb, done] =
      before === after
        ? ['same    ', 'same    ']
        : before === undefined
          ? ['write   ', 'wrote   ']
          : ['update  ', 'updated ']
    console.log(`  ${options.dryRun ? verb : done} ${file}`)
    if (!options.dryRun && before !== after) await writeFile(file, after)
  }
  if (options.dryRun) return

  console.log(`
Next, add components, like \`dui add button\`, and render one:
https://dui.aak.sh/docs/installation#use-them`)
}

// A JSON file with these values set in it, as before and after texts. It edits only the values
// it sets, so comments (bun init's tsconfig.json has some) and formatting stay.
async function plan(file: string, values: Record<string, Record<string, string>>) {
  let before = existsSync(file) ? await readFile(file, 'utf8') : undefined
  let after = before ?? '{}\n'
  try {
    for (let [key, object] of Object.entries(values)) {
      for (let [name, value] of Object.entries(object)) after = set(after, [key, name], value)
    }
    let parsed = Bun.JSONC.parse(after) as Record<string, Record<string, unknown> | undefined>
    for (let [key, object] of Object.entries(values)) {
      for (let [name, value] of Object.entries(object)) {
        if (parsed[key]?.[name] !== value) throw new Error(`${key}.${name} isn't set`)
      }
    }
  } catch (error) {
    let reason = error instanceof Error ? error.message : String(error)
    throw new Error(`couldn't update ${file} (${reason}), so nothing was written`)
  }
  return { file, before, after }
}
