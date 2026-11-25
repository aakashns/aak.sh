# dui

- `site/` is dui.aak.sh and the component registry; `package/` is the `@aakashns/dui` CLI.
  Run site commands from `site/`
- `site/src/ui/` and `site/src/lib/` get copied into other projects: keep site-only code out,
  and import between them with relative paths (`../lib/jsx/jsx-runtime.ts`), not `#jsx`
- A component is `ui/<name>.tsx` + `ui/<name>.css`, exporting the component and `<NAME>_CSS`.
  List it in `src/registry.ts` (with its `registryDependencies`), and add a preview and usage
  to `src/pages/examples.tsx`
- Match shadcn/ui's markup and look with `data-slot`/`data-variant` attributes and plain CSS
  on the theme's tokens. Unknown props go on the element as they are, so Datastar attributes
  pass through
- The only browser JavaScript is Datastar; prefer native elements (`<dialog>`, `command`)
- Keep shadcn/ui's URLs (`/docs/components/<name>`) and `/r/<name>.json`'s shape: published
  CLIs fetch it
- `package/cli.js` runs on Node 20+ with no dependencies. Bumping its version publishes it;
  component changes don't need a release
- Before a PR: `bun run check`, then open the changed component pages in Playwright and attach
  screenshots
- The site runs as `dui.service` from `/srv/aak.sh/dui/site`: dependency or unit changes need
  the steps in `README.md` on the server
