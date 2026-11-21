# Contributing to writui

writui is built mainly for its author's own daily writing, and developed in
the open, in the [aak.sh](https://github.com/aakashns/aak.sh) repo with its
author's other projects. Bug reports and ideas are very welcome as
[issues](https://github.com/aakashns/aak.sh/issues) (start the title with
"writui:"). For anything bigger
than a small fix, please open an issue before a pull request, so we can
agree on the approach first.

## Where things are

```
src/          the app (a single Rust crate)
site/         the project site, writui.aak.sh (Zola)
install.sh    the one-line installer for macOS and Linux

../.github/workflows/writui-*.yml   CI and release workflows (at the repo root)
```

`AGENTS.md` (which `CLAUDE.md` points to) describes the day-to-day workflow in detail: how PRs are put
together, tested and shipped.

## Build and run

You need [Rust](https://rustup.rs) 1.85 or newer and a C compiler (Xcode
command line tools on macOS, `build-essential` on Debian/Ubuntu, Visual
Studio Build Tools plus Strawberry Perl on Windows, building from PowerShell).
The first build takes a few minutes, because it compiles the encryption
libraries (SQLCipher and OpenSSL) from source.

```sh
cargo run
```

**Debug builds never touch your real vault.** They keep their vault and
config in `.dev-data/` inside the repo, and that vault's password is always
`writui-dev` (the unlock screen of a debug build says so). For a throwaway
vault, pass `--db /tmp/somewhere/writui.db` and use the same password.

To install your own release build instead of a downloaded one:

```sh
cargo install --locked --path .
```

## Before opening a pull request

```sh
cargo fmt
cargo test
cargo clippy --all-targets -- -D warnings
```

CI checks the formatting and runs the other two on Linux and macOS for every pull request (not Windows: run
them there yourself if a change could affect it, e.g. paths or the
terminal). Also try
the change in the real app, in a couple of different terminals if it
touches what's drawn on screen. A few rules the app sticks to:

- Only the terminal's 16 standard colours, so it fits any theme.
- Everything works with the mouse, everything also has a shortcut, and the
  shortcuts are shown in the hint bar.
- Changes to what's stored in the vault are migrations. The vault is backed
  up before a migration runs, and the backup is only removed once the
  migrated vault passes its integrity checks. Never lose someone's writing.

Pull request descriptions explain what changes for the person using the
app, with screenshots for anything visible.

## Versions and releases

Every PR that changes the app bumps `version` in `Cargo.toml`: minor for new
behaviour, patch for fixes only. Merging a PR with a new version releases it
automatically: GitHub Actions builds the macOS and Linux binaries and
publishes them, with `install.sh` and GitHub's generated notes (the merged PRs), as a
GitHub release tagged `writui-vX.Y.Z`. PRs that keep the version (docs only)
release nothing. Releases up to 0.20.0 are on the old
[aakashns/writui](https://github.com/aakashns/writui/releases) repo, from
before writui moved here.

## The site

[writui.aak.sh](https://writui.aak.sh) is built from `site/` with
[Zola](https://www.getzola.org) and served by Caddy (`site/Caddyfile`),
like the repo's other project sites. The build isn't committed: on the
server, `site/build.sh` builds it into `site/public` after each pull. It
uses a pinned Zola version (downloading it if yours differs), and CI checks
it builds. The old domain, writui.com, redirects there. To preview it
locally:

```sh
zola --root site serve      # then open http://127.0.0.1:1111
site/build.sh               # or build it into site/public, as the server does
```

- **Blog posts** are written in writui and exported as markdown
  (Ctrl+Shift+S) straight into `site/content/blog/`, with front matter on
  (Zola reads YAML front matter, and needs a `title` and `date`). To edit a
  published post, import it (Ctrl+O on the list), and export it back.
- **Changelog** in the site's menu links to the
  [writui's GitHub releases](https://github.com/aakashns/aak.sh/releases?q=writui-v&expanded=true).
- **The logo** is `site/static/logo.svg` (and `favicon.svg`, the same on a
  dark rounded square). The PNG icons, `favicon.ico` and the social card
  `og.png` were rendered from them; re-render them if the logo changes.
- **The demo video** on the landing page is recorded with
  [VHS](https://github.com/charmbracelet/vhs) from `site/demo.tape`; the
  tape's first lines say how to re-record it.
- **The first-session guide's screenshots** come from
  `site/first-session.tape`. From the repo root, run
  `bash site/record-first-session.sh` with VHS and `cwebp` installed. It
  records the debug app with synthetic writing in a new throwaway vault,
  then crops and losslessly compresses the six screenshots as WebP. Raw
  screenshots and the review GIF stay in `/tmp/writui-first-session-captures`.

## License

writui is under the [MIT license](LICENSE.txt). By contributing, you agree
that your contributions are licensed the same way.
