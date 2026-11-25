# dui

Datastar UI components in the style of shadcn/ui: server-rendered JSX and plain CSS that the
`dui` CLI copies into your project. Docs at [dui.aak.sh](https://dui.aak.sh).

```sh
curl -fsSL https://dui.aak.sh/install.sh | sh
dui add button card
```

`site/` is both: one binary, `dui`, on Bun, Effect, and Datastar like LogSpace, which runs
dui.aak.sh (`dui start`) and adds its components to projects (`dui add`), fetching them from
the site's `/r/<name>.json`. The components are `site/src/ui/`, what they share
`site/src/lib/`, and `site/src/registry.ts` lists them.

```sh
cd site
bun install
bun run dev     # http://127.0.0.1:3000
bun run check   # types and formatting
bun run build   # dist/dui, for this platform

# Add components from the dev server, from another project:
DUI_REGISTRY=http://127.0.0.1:3000/r bun path/to/dui/site/src/cli/main.ts add button
```

## Release and deploy

Bump `site/package.json`'s version in a PR; merging it publishes the `dui-v<version>` release
(see `.github/workflows/dui-release.yml`). Then, on the server:

```sh
curl -fsSL https://dui.aak.sh/install.sh | DUI_VERSION=<version> sh
sudo dui deploy
```

`install.sh` installs the version dui.aak.sh runs unless `DUI_VERSION` says otherwise, so the
site goes first. The first time, before dui.aak.sh is up, get it from
`https://raw.githubusercontent.com/aakashns/aak.sh/main/dui/site/public/install.sh`.
`deploy` runs the binary as `dui.service` on 127.0.0.1:44200, and adds a `dui.aak.sh` block to
`/etc/caddy/Caddyfile` the first time.
