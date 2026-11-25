# dui

Datastar UI components in the style of shadcn/ui: server-rendered JSX and plain CSS that a CLI
copies into your project. Docs at [dui.aak.sh](https://dui.aak.sh).

- `site/`: dui.aak.sh, on Bun, Effect, and Datastar, like LogSpace, run by `site/dui.service`
  behind Caddy. The components are `site/src/ui/`, and what they share `site/src/lib/`;
  `site/src/registry.ts` lists them, and the site serves each as JSON at `/r/<name>.json`.
- `package/`: `@aakashns/dui`, the CLI that copies them from `/r/`. Bump its version to publish
  it (see `.github/workflows/dui-release.yml`).

```sh
cd site
bun install
bun run dev     # http://127.0.0.1:3000
bun run check   # types and formatting

# Try the CLI against the dev server, from another project:
DUI_REGISTRY=http://127.0.0.1:3000/r node path/to/dui/package/cli.js add button
```

## Deploy

On the web server, in `/srv/aak.sh/dui/site`: pull `main`, run `bun install --frozen-lockfile`,
and `sudo systemctl restart dui`. The first time, copy Bun to `/usr/local/bin/bun`, install
`dui.service` as its header says, and copy `Caddyfile`'s block into the server's Caddyfile.
