# dui

Datastar UI components in the style of shadcn/ui: server-rendered JSX and plain CSS that a CLI
copies into your project. Docs at [dui.aak.sh](https://dui.aak.sh).

- `site/`: dui.aak.sh, on Bun, Effect, and Datastar, like LogSpace, and released like it as one
  binary, `dui-site`. The components are `site/src/ui/`, and what they share `site/src/lib/`;
  `site/src/registry.ts` lists them, and the site serves each as JSON at `/r/<name>.json`.
- `package/`: `@aakashns/dui`, the CLI that copies them from dui.aak.sh's `/r/`. Bump its
  version to publish it (see `.github/workflows/dui-package-release.yml`).

```sh
cd site
bun install
bun run dev     # http://127.0.0.1:3000
bun run check   # types and formatting
bun run build   # dist/dui-site, for this platform

# Try the CLI against the dev server, from another project:
DUI_REGISTRY=http://127.0.0.1:3000/r node path/to/dui/package/cli.js add button
```

## Deploy

Bump `site/package.json`'s version in a PR; merging it publishes the `dui-site-v<version>`
release (see `.github/workflows/dui-site-release.yml`). Then, on the server:

```sh
version=0.1.0 arch=$(uname -m | sed 's/x86_64/x64/; s/aarch64/arm64/')
curl -fsSLo dui-site "https://github.com/aakashns/aak.sh/releases/download/dui-site-v$version/dui-site-linux-$arch"
sudo install dui-site /usr/local/bin/ && rm dui-site
sudo dui-site deploy
```

`deploy` runs the binary as `dui.service` on 127.0.0.1:44200, and adds a `dui.aak.sh` block to
`/etc/caddy/Caddyfile` the first time.
