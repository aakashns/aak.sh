// dui: adds dui's components to a project, and runs dui.aak.sh itself.
import { parseArgs } from 'node:util'

import packageJson from '../../package.json' with { type: 'json' }
import { add, list } from './add.ts'
import { deploy } from './deploy.ts'

const HELP = `dui ${packageJson.version}: Datastar UI components (https://dui.aak.sh)

  dui add <component...>   Copy components into ui/, and what they share into lib/
      --dir <folder>       Where ui/ and lib/ go (src if there is one, or else here)
      --overwrite          Replace files that exist
  dui list                 List the components
  dui version              Print dui's version

Running dui.aak.sh:
  dui start                Serve the site (PORT, HOST)
  sudo dui deploy          Run it as a service on this server, behind Caddy`

let { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { dir: { type: 'string' }, overwrite: { type: 'boolean', short: 'o' } },
})
let [command, ...args] = positionals

try {
  if (command === 'add' && args.length) await add(args, values)
  else if (command === 'list') await list()
  else if (command === 'version') console.log(packageJson.version)
  else if (command === 'start') {
    // Only loaded here, as it renders every page.
    let { serve } = await import('../server.ts')
    serve(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1')
  } else if (command === 'deploy') deploy(packageJson.version)
  else {
    console.log(HELP)
    if (command !== 'help') process.exitCode = 1
  }
} catch (error) {
  console.error(`dui: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
}
