# toolchains.sh: installs the latest Go, and, as your user, the latest bun,
# Node with Vite+, Python with uv, Rust with rustup, and Playwright with
# Chromium, each with its own installer, in the usual place, and as it usually
# sets up your shell. Once they're installed, running setup again asks before
# upgrading any of them.

GO_DIR=/usr/local/go # where go.dev's instructions put it

# install_go: installs the latest Go in GO_DIR, from go.dev, which rembox's
# zshenv puts on PATH, as apt's is old (1.19 on Debian 12). If there's an
# older Go there, it asks to upgrade it. Runs as root.
install_go() {
  step "Install the latest Go"
  local releases version have=''
  [[ -f $GO_DIR/VERSION ]] && have=$(head -n 1 "$GO_DIR/VERSION")
  have=${have#go}
  if releases=$(curl -fsSL 'https://go.dev/dl/?mode=json'); then
    version=$(jq -r '.[0].version | ltrimstr("go")' <<<"$releases")
  else
    version=''
  fi
  if [[ -z $version && -z $have ]]; then
    warn "Couldn't find Go's latest release on go.dev, so it's not installed. Run rembox setup again later."
    checklist warn ", but not Go"
    return
  fi
  if ! wants_latest Go "$have" "$version"; then
    checklist ok " and Go $have"
    return
  fi

  local file sha256 dir
  file=go$version.linux-$(dpkg --print-architecture).tar.gz
  sha256=$(jq -r --arg file "$file" '.[0].files[] | select(.filename == $file) | .sha256' <<<"$releases")
  [[ -n $sha256 ]] || fail "Go's latest release, $version, has no $file with a SHA-256, so it's not installed."
  dir=$(mktemp -d)
  run curl -fsSL -o "$dir/$file" "https://go.dev/dl/$file"
  if ! run sha256sum --check --strict <<<"$sha256  $dir/$file"; then
    rm -rf "$dir"
    fail "The download of Go isn't the file go.dev lists, so it's not installed."
  fi
  # go.dev says to remove the old Go first, not to unpack over it.
  [[ ! -e $GO_DIR ]] || run rm -rf "$GO_DIR"
  run tar -xzf "$dir/$file" -C "${GO_DIR%/*}"
  rm -rf "$dir"
  ok "Go $version is installed in $GO_DIR."
  checklist ok " and Go $version"
}

# setup_toolchains: installs or upgrades bun, Node, Python and Rust. Runs as
# your user, with zsh as your login shell, as the installers add their folders
# to PATH in its files. This script calls them by path, not from PATH, as bun's
# installer sets up your shell only if bun isn't on PATH yet.
setup_toolchains() {
  ((EUID != 0)) || fail "Run this as your user, not root."
  setup_bun
  checklist_version "" bun "$(version_of "$HOME/.bun/bin/bun")"
  setup_node
  checklist_version ", " Node "$("$HOME/.local/share/vite-plus/bin/vp" env list --json 2>/dev/null |
    jq -r '.node[] | select(.default) | .version | ltrimstr("v")' || true)"
  setup_python
  checklist_version ", " Python "$(version_of "$HOME/.local/bin/python")"
  setup_rust
  checklist_version ", " Rust "$(version_of "$HOME/.cargo/bin/rustc")"
}

# checklist_version SEPARATOR NAME VERSION: adds NAME and VERSION, the version
# installed, to the checklist line, after SEPARATOR, or warns if it's empty.
checklist_version() {
  if [[ -n $3 ]]; then
    checklist ok "$1$2 $3"
  else
    checklist warn "$1no $2"
  fi
}

# setup_bun: installs the latest bun, in ~/.bun, or upgrades it.
setup_bun() {
  step "Install the latest bun"
  local bun=$HOME/.bun/bin/bun have latest
  have=$("$bun" --version 2>/dev/null || true)
  latest=$(npm_latest bun)
  wants_latest bun "$have" "$latest" || return 0
  if [[ -n $have ]]; then
    run "$bun" upgrade || { warn "bun couldn't upgrade, as it says above. To try again: bun upgrade"; return; }
  else
    run_installer https://bun.sh/install bash SCRIPT ||
      { warn "bun couldn't install, as it says above. Run rembox setup again later."; return; }
  fi
  ok "bun $("$bun" --version) is installed."
}

# setup_node: installs the latest Vite+ (vp), in ~/.local/share/vite-plus, or
# upgrades it, then makes the latest Node its default.
setup_node() {
  step "Install the latest Node, with Vite+"
  local vp=$HOME/.local/share/vite-plus/bin/vp have latest
  have=$("$vp" --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)+' | head -n 1 || true)
  latest=$(npm_latest vite-plus)
  if wants_latest Vite+ "$have" "$latest"; then
    if [[ -n $have ]]; then
      run "$vp" upgrade || warn "Vite+ couldn't upgrade, as it says above. To try again: vp upgrade"
    else
      # It asks whether Vite+ should manage Node (yes) and bun (no; bun.sh's
      # installer does).
      run_installer https://vite.plus env VP_NODE_MANAGER=yes VP_BUN_MANAGER=no bash SCRIPT ||
        { warn "Vite+ couldn't install, as it says above, so Node isn't installed. Run rembox setup again later."; return; }
    fi
  fi

  have=$("$vp" env list --json 2>/dev/null | jq -r '.node[] | select(.default) | .version' || true)
  latest=$("$vp" env list-remote --json 2>/dev/null | jq -r '.node[] | select(.latest) | .version' || true)
  if [[ -z $have && -z $latest ]]; then
    warn "Couldn't find Node's latest version, so it's not installed. Run rembox setup again later."
    return
  fi
  wants_latest Node "$have" "$latest" || return 0
  if ! { run "$vp" env install "$latest" && run "$vp" env default "$latest"; }; then
    warn "Vite+ couldn't install Node $latest, as it says above. Run rembox setup again later."
    return
  fi
  ok "Node $latest is installed, and is Vite+'s default."
}

# setup_playwright: installs the latest Playwright, as a global package of
# Vite+'s, with playwright in ~/.local/share/vite-plus/bin, or upgrades it,
# then the Chromium it uses, with the system libraries Chromium needs, which
# Playwright installs with sudo. Runs as your user, after setup_node.
setup_playwright() {
  step "Install the latest Playwright, with Chromium"
  ((EUID != 0)) || fail "Run this as your user, not root."
  local bin=$HOME/.local/share/vite-plus/bin have latest
  if [[ ! -x $bin/node ]]; then
    warn "Playwright needs Node, which isn't installed, so it isn't either. Run rembox setup again later."
    checklist warn "No Playwright, as there's no Node"
    return
  fi
  have=$(version_of "$bin/playwright")
  latest=$(npm_latest playwright)
  if wants_latest Playwright "$have" "$latest"; then
    run "$bin/vp" install -g playwright@latest || warn "Vite+ couldn't install Playwright, as it says above. Run rembox setup again later."
  fi
  have=$(version_of "$bin/playwright")
  if [[ -z $have ]]; then
    checklist warn "Playwright didn't install"
    return
  fi
  if ! chromium_installed "$bin/playwright"; then
    info "Playwright installs the libraries Chromium needs with sudo, which may ask for $(id -un)'s password on $HOSTNAME."
    if ! at_terminal "$bin/playwright" install --with-deps chromium; then
      warn "Playwright couldn't install Chromium, as it says above. To try again: playwright install --with-deps chromium"
      checklist warn "Playwright $have, without Chromium"
      return
    fi
  fi
  ok "Playwright $have is installed, with Chromium."
  checklist ok "Playwright $have, with Chromium"
}

# chromium_installed PLAYWRIGHT: succeeds if the Chromium PLAYWRIGHT uses is
# installed, in the folder its dry run shows first, which Playwright marks once
# it's done.
chromium_installed() {
  local dir
  dir=$("$1" install --dry-run chromium 2>/dev/null | awk '/Install location:/ { print $3; exit }' || true)
  [[ -n $dir && -f $dir/INSTALLATION_COMPLETE ]]
}

# setup_python: installs the latest uv, in ~/.local/bin, or upgrades it, then
# installs the latest Python with it, as python and python3 in ~/.local/bin.
setup_python() {
  step "Install the latest Python, with uv"
  local uv=$HOME/.local/bin/uv have latest
  have=$("$uv" --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)+' | head -n 1 || true)
  latest=$(curl -fsSL https://pypi.org/pypi/uv/json 2>/dev/null | jq -r .info.version || true)
  if wants_latest uv "$have" "$latest"; then
    if [[ -n $have ]]; then
      run "$uv" self update || warn "uv couldn't upgrade, as it says above. To try again: uv self update"
    else
      run_installer https://astral.sh/uv/install.sh sh SCRIPT ||
        { warn "uv couldn't install, as it says above, so Python isn't installed. Run rembox setup again later."; return; }
    fi
  fi

  have=$("$HOME/.local/bin/python" --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)+' || true)
  # The newest CPython uv can download that isn't a prerelease, like 3.16.0a2.
  latest=$("$uv" python list --only-downloads --output-format json 2>/dev/null |
    jq -r '.[] | select(.implementation == "cpython" and .variant == "default") | .version | select(test("^[0-9.]+$"))' |
    sort -V | tail -n 1 || true)
  if [[ -z $have && -z $latest ]]; then
    warn "Couldn't find Python's latest version, so it's not installed. Run rembox setup again later."
    return
  fi
  wants_latest Python "$have" "$latest" || return 0
  run "$uv" python install --default "$latest" ||
    { warn "uv couldn't install Python $latest, as it says above. Run rembox setup again later."; return; }
  ok "Python $latest is installed, as python and python3."
}

# setup_rust: installs rustup, in ~/.cargo and ~/.rustup, with the latest
# stable Rust, or upgrades it.
setup_rust() {
  step "Install the latest Rust, with rustup"
  local cargo=$HOME/.cargo/bin
  if [[ ! -x $cargo/rustup ]]; then
    run_installer https://sh.rustup.rs sh SCRIPT -y ||
      { warn "rustup couldn't install Rust, as it says above. Run rembox setup again later."; return; }
    ok "$("$cargo/rustc" --version) is installed, with cargo, clippy and rustfmt."
    return
  fi
  local have latest
  have=$("$cargo/rustc" --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)+' | head -n 1 || true)
  # Like "stable-x86_64-unknown-linux-gnu - Update available : 1.99.1 (…) -> 1.100.0 (…)",
  # or "… - up to date: 1.100.0 (…)": the last version is the latest.
  latest=$("$cargo/rustup" check 2>/dev/null | grep '^stable-' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | tail -n 1 || true)
  wants_latest Rust "$have" "$latest" || return 0
  run "$cargo/rustup" update || { warn "rustup couldn't upgrade Rust, as it says above. To try again: rustup update"; return; }
  ok "$("$cargo/rustc" --version) is installed."
}

# wants_latest NAME HAVE LATEST: succeeds if NAME should be installed or
# upgraded: if it isn't installed (HAVE is empty), or LATEST is newer than
# HAVE and you agree to upgrade it. Says why not, otherwise.
wants_latest() {
  local name=$1 have=$2 latest=$3
  [[ -n $have ]] || return 0
  if [[ -z $latest ]]; then
    warn "Couldn't find $name's latest version, so it stays at $have. Run rembox setup again later."
    return 1
  fi
  if ! older "$have" "$latest"; then
    ok "$name $have is the latest."
    return 1
  fi
  if confirm "Upgrade $name from $have to $latest?" yes; then
    return 0
  fi
  ok "$name stays at $have."
  return 1
}

# older A B: succeeds if version A comes before version B.
older() {
  # GNU version sort puts a tilde before the corresponding stable release.
  local a=${1/-/~} b=${2/-/~}
  [[ $a != "$b" && $(printf '%s\n' "$a" "$b" | sort -V | head -n 1) == "$a" ]]
}

# npm_latest PACKAGE: prints the latest version of the npm package PACKAGE, or
# nothing if npm's registry doesn't say.
npm_latest() {
  curl -fsSL "https://registry.npmjs.org/$1/latest" 2>/dev/null | jq -r '.version // ""' || true
}

# run_installer URL COMMAND...: downloads the install script at URL, then runs
# COMMAND, with the script's path for the word SCRIPT in it. Returns the
# download's or the command's exit status.
run_installer() {
  local url=$1 script arg args=() status=0
  shift
  script=$(mktemp)
  for arg; do
    [[ $arg == SCRIPT ]] && arg=$script
    args+=("$arg")
  done
  { run curl -fsSL -o "$script" "$url" && run "${args[@]}"; } || status=$?
  rm -f "$script"
  return "$status"
}

# Install Cloudflare's cf CLI as a global package alongside Node.
setup_cf() {
  step "Install the Cloudflare CLI (cf)"
  local bin=$HOME/.local/share/vite-plus/bin have latest
  if [[ ! -x $bin/node ]]; then
    checklist warn "Cloudflare CLI needs Node"
    return
  fi
  local PATH=$bin:$PATH
  have=$(cf_version "$bin/cf")
  latest=$(npm_latest cf)
  if wants_latest cf "$have" "$latest"; then
    run "$bin/vp" install -g cf@latest || warn "Couldn't install cf. To retry: vp install -g cf@latest"
  fi
  checklist_version "" "Cloudflare CLI" "$(cf_version "$bin/cf")"
}

# Include prerelease suffixes, as cf publishes release candidates.
cf_version() {
  "$1" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+([-+][[:alnum:].-]+)?' | head -1 || true
}
