// dui-site, the binary that runs dui.aak.sh: `start` serves it, and `deploy` sets up a server
// to run it (see deploy.ts).
import packageJson from '../package.json' with { type: 'json' }
import { deploy } from './deploy.ts'
import { serve } from './server.ts'

let [command = 'start'] = process.argv.slice(2)
if (command === 'start') {
  serve(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1')
} else if (command === 'deploy') {
  try {
    deploy(packageJson.version)
  } catch (error) {
    console.error(`dui-site: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
} else if (command === 'version') {
  console.log(packageJson.version)
} else {
  console.error('Usage: dui-site [start | deploy | version]')
  process.exit(1)
}
