// dui: adds dui's components to a project, and runs dui.aak.sh itself.
import { parseArgs } from 'node:util'

import packageJson from '../../package.json' with { type: 'json' }
import { add, diff, hasJsx, list } from './add.ts'
import { deploy } from './deploy.ts'
import { init } from './init.ts'

const HELP = `dui ${packageJson.version}: Datastar UI components (https://dui.aak.sh)

  dui init                 Set a Bun project up: add lib/, and point JSX at it
  dui add <component...>   Copy components into ui/, and what they share into lib/
      --overwrite          Replace the named components' files where yours differ
      --dry-run            Say what it would write, and write nothing
  dui diff [component...]  Show how your copies differ from this version's
  dui list                 List the components
  dui version              Print dui's version

  --dir <folder>           Where ui/ and lib/ go (src if there is one, or else here)

Running dui.aak.sh:
  dui start                Serve the site (PORT, HOST)
  sudo dui deploy          Run it as a service on this server, behind Caddy`

try {
  let { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      dir: { type: 'string' },
      overwrite: { type: 'boolean', short: 'o' },
      'dry-run': { type: 'boolean', short: 'n' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  })
  let [command, ...args] = positionals
  let options = { dir: values.dir, overwrite: values.overwrite, dryRun: values['dry-run'] }

  if (values.help || command === 'help') console.log(HELP)
  else if (values.version || command === 'version') console.log(packageJson.version)
  else if (command === 'init') await init(options)
  else if (command === 'add' && args.length) {
    await add(args, options)
    if (!options.dryRun && !(await hasJsx())) {
      console.log("\nRun `dui init`, if you haven't, to point JSX at lib/jsx.")
    }
  } else if (command === 'diff') await diff(args, options)
  else if (command === 'list') await list()
  else if (command === 'start') {
    // Only loaded here, as it renders every page.
    let { serve } = await import('../server.ts')
    serve(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1')
  } else if (command === 'deploy') deploy(packageJson.version)
  else {
    console.error(HELP)
    process.exitCode = 1
  }
} catch (error) {
  let message = error instanceof Error ? error.message : String(error)
  // A flag it doesn't know, or one missing its value.
  let usage = (error as { code?: string }).code?.startsWith('ERR_PARSE_ARGS')
  console.error(`dui: ${message}${usage ? ' (see `dui help`)' : ''}`)
  process.exitCode = 1
}
