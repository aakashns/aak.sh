// Builds dist/dui-site for the platform it runs on: one file with Bun, the site, and everything
// it serves (see src/public.ts and src/sources.ts).
import { join } from 'node:path'

let result = await Bun.build({
  entrypoints: [join(import.meta.dir, '../src/main.ts')],
  compile: {
    outfile: join(import.meta.dir, '../dist/dui-site'),
    autoloadDotenv: false,
    autoloadBunfig: false,
  },
  minify: { syntax: true, whitespace: true },
})
if (!result.success) {
  for (let log of result.logs) console.error(log)
  process.exit(1)
}
