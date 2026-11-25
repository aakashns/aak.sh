// `sudo dui deploy`: runs this binary as dui.service on 127.0.0.1:44200, and adds a block
// for dui.aak.sh to Caddy's config the first time. Run it again after replacing the binary.
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'

const PORT = 44200
const SERVICE_FILE = '/etc/systemd/system/dui.service'
const CADDYFILE = '/etc/caddy/Caddyfile'
const CADDY_BLOCK = `dui.aak.sh {\n\tencode zstd gzip\n\treverse_proxy 127.0.0.1:${PORT}\n}\n`

const service = (binary: string) => `[Unit]
Description=dui.aak.sh
After=network.target

[Service]
Type=exec
ExecStart=${binary} start
Environment=HOST=127.0.0.1
Environment=PORT=${PORT}
DynamicUser=yes
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
PrivateDevices=yes
RestrictAddressFamilies=AF_INET AF_INET6
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
`

function run(...command: string[]) {
  let { exitCode, stderr } = Bun.spawnSync(command, { stderr: 'pipe' })
  if (exitCode !== 0) throw new Error(`${command.join(' ')}: ${stderr.toString().trim()}`)
}

export function deploy(version: string) {
  if (process.platform !== 'linux' || process.getuid?.() !== 0) {
    throw new Error('Run it as root on a Linux server: sudo dui deploy')
  }
  let binary = realpathSync(process.execPath)
  if (basename(binary) === 'bun') throw new Error('Run it from the built binary, not with bun')

  console.log(`Installing dui.service, which runs ${binary}...`)
  writeFileSync(SERVICE_FILE, service(binary), { mode: 0o644 })
  run('systemctl', 'daemon-reload')
  run('systemctl', 'enable', '--quiet', 'dui')
  run('systemctl', 'restart', 'dui')

  let caddyfile = existsSync(CADDYFILE) ? readFileSync(CADDYFILE, 'utf8') : ''
  if (/^dui\.aak\.sh\s*\{/m.test(caddyfile)) {
    console.log(`${CADDYFILE} already has dui.aak.sh`)
  } else {
    console.log(`Adding dui.aak.sh to ${CADDYFILE}...`)
    let updated = caddyfile ? `${caddyfile.trimEnd()}\n\n${CADDY_BLOCK}` : CADDY_BLOCK
    // Validated beside the real one, so relative imports resolve the same, and readable only
    // by root, like the config it copies may need to be.
    let candidate = `${CADDYFILE}.dui-${process.pid}`
    try {
      writeFileSync(candidate, updated, { flag: 'wx', mode: 0o600 })
      run('caddy', 'validate', '--adapter', 'caddyfile', '--config', candidate)
    } finally {
      rmSync(candidate, { force: true })
    }
    writeFileSync(`${CADDYFILE}.bak`, caddyfile, { mode: 0o600 })
    writeFileSync(CADDYFILE, updated)
    try {
      run('systemctl', 'reload', 'caddy')
    } catch (error) {
      writeFileSync(CADDYFILE, caddyfile)
      throw new Error(`Caddy didn't take the new config, so the old one is back. ${error}`)
    }
  }
  console.log(`Done: dui ${version} is at https://dui.aak.sh`)
}
