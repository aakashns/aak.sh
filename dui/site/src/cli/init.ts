// `dui init` sets a Bun project up for dui's components, and running it again changes nothing:
// it adds lib/ (the JSX runtime and the theme) beside where ui/ goes, maps the `#jsx/*` import
// in package.json to lib/jsx, and points tsconfig.json's JSX at it.
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

import { add, sourceDir, type Options } from './add.ts'

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

  await add(['lib'], { ...options, overwrite: false })
  if (options.dryRun) return

  let text = await readFile('package.json', 'utf8')
  let pkg = JSON.parse(text) as { imports?: Record<string, string> }
  if (pkg.imports?.['#jsx/*'] === mapping) console.log('  same     package.json')
  else {
    pkg.imports = { ...pkg.imports, '#jsx/*': mapping }
    await writeFile('package.json', JSON.stringify(pkg, null, indent(text)) + '\n')
    console.log(`  updated  package.json ("imports": { "#jsx/*": "${mapping}" })`)
  }

  let tsconfig = existsSync('tsconfig.json') ? await readFile('tsconfig.json', 'utf8') : undefined
  let updated = tsconfig === undefined ? newTsconfig() : setJsx(tsconfig)
  if (updated === tsconfig) console.log('  same     tsconfig.json')
  else {
    await writeFile('tsconfig.json', updated)
    console.log(
      `  ${tsconfig === undefined ? 'wrote  ' : 'updated'}  tsconfig.json (JSX from #jsx)`,
    )
  }

  console.log(`
Next, add components, like \`dui add button\`, and render one:
https://dui.aak.sh/docs/installation#use-them`)
}

const indent = (json: string) => /\n([ \t]+)"/.exec(json)?.[1] ?? 2

const newTsconfig = () => JSON.stringify({ compilerOptions: JSX }, null, 2) + '\n'

// Sets compilerOptions.jsx and jsxImportSource, editing the text so its comments (bun init's
// tsconfig.json has some) and formatting stay as they are.
function setJsx(tsconfig: string) {
  let text = tsconfig
  for (let [key, value] of Object.entries(JSX)) {
    let existing = new RegExp(`("${key}"\\s*:\\s*)"[^"]*"`)
    if (existing.test(text)) text = text.replace(existing, `$1"${value}"`)
    else {
      let options = /"compilerOptions"\s*:\s*\{(\s*\})?/.exec(text)
      if (!options) return newTsconfigFrom(text)
      let [match, empty] = options
      let line = `"${key}": "${value}"`
      let at = options.index + match.length - (empty?.length ?? 0)
      text = text.slice(0, at) + `\n    ${line}${empty ? '\n  ' : ','}` + text.slice(at)
    }
  }
  let parsed = Bun.JSONC.parse(text) as { compilerOptions?: Record<string, unknown> }
  if (Object.entries(JSX).some(([key, value]) => parsed.compilerOptions?.[key] !== value)) {
    throw new Error(`couldn't update tsconfig.json: set "jsx": "react-jsx" and
"jsxImportSource": "#jsx" in its "compilerOptions"`)
  }
  return text
}

// A tsconfig.json without compilerOptions: parsed and written again with them.
function newTsconfigFrom(text: string) {
  let parsed = Bun.JSONC.parse(text) as Record<string, unknown>
  return JSON.stringify({ ...parsed, compilerOptions: JSX }, null, 2) + '\n'
}
