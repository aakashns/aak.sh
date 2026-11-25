# dui

- `site/` is one Bun binary, `dui`: it serves dui.aak.sh (`dui start`), deploys it
  (`sudo dui deploy`), and adds the components built into it to projects (`dui init`,
  `dui add`). Run commands from `site/`
- `site/src/ui/` and `site/src/lib/` get copied into other projects: keep site-only code out,
  and import between them with relative paths (`../lib/jsx/jsx-runtime.ts`), not `#jsx`
- A component is `ui/<name>.tsx` + `ui/<name>.css`, exporting the component and `<NAME>_CSS`.
  List it in `src/registry.ts` (with its `registryDependencies`). Write each example as
  `src/examples/<name>-<case>.tsx`, and list them with its shadcn/ui differences in
  `src/pages/examples.tsx`: the page renders each file and shows its code
- Datastar's `data-attr` writes `true` as an empty attribute: wrap values that CSS or ARIA
  read as `"true"` in `String(…)`
- Match shadcn/ui's markup and look with `data-slot`/`data-variant` attributes and plain CSS
  on the theme's tokens. Unknown props go on the element as they are, so Datastar attributes
  pass through
- The only browser JavaScript is Datastar; prefer native elements (`<dialog>`, `command`)
- Keep shadcn/ui's URLs (`/docs/components/<name>`) and `/r/<name>.json`'s shape: installed
  CLIs fetch it
- Anything the binary serves must be embedded (`with { type: 'file' }` or `'text'`, or
  `src/sources.ts`'s macro). Bump `site/package.json`'s version to release it, then deploy as
  `README.md` says; component changes reach `dui add` with the next release
- Example forms post (`method="post"`) and Datastar handles `data-on:submit`, so nothing typed
  lands in a URL
- Before a PR: `bun run check`, and `bun scripts/e2e.ts` against the dev server (it fails on
  contrast in either scheme), then attach screenshots of the changed component pages
