// A Bun macro, run when the site is bundled into its binary (or started from source): the files
// matching a glob, by path, so the site serves their code without reading files at runtime.
import { readFileSync } from 'node:fs'

export function readSources(pattern: string): Record<string, string> {
  let dir = new URL('.', import.meta.url).pathname
  let paths = new Bun.Glob(pattern).scanSync({ cwd: dir })
  return Object.fromEntries([...paths].sort().map((p) => [p, readFileSync(dir + p, 'utf8')]))
}

// One file's code, by its path from src/.
export function readSource(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}
