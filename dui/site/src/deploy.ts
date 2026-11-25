// `sudo dui deploy`: runs this binary as dui.service on 127.0.0.1:44200, and adds a block
// for dui.aak.sh to Caddy's config the first time. Run it again after replacing the binary.
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

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
    let candidate = join(tmpdir(), `dui-Caddyfile-${process.pid}`)
    writeFileSync(candidate, updated)
    run('caddy', 'validate', '--adapter', 'caddyfile', '--config', candidate)
    writeFileSync(`${CADDYFILE}.bak`, caddyfile)
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
