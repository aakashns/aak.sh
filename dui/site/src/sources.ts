// A Bun macro, run when the site is bundled into its binary (or started from source): the code
// in lib/ and ui/, by path, so the registry serves it without reading files at runtime.
import { readFileSync } from 'node:fs'

export function readSources(): Record<string, string> {
  let dir = new URL('.', import.meta.url).pathname
  let paths = new Bun.Glob('{lib,ui}/**/*').scanSync({ cwd: dir })
  return Object.fromEntries([...paths].sort().map((p) => [p, readFileSync(dir + p, 'utf8')]))
}
