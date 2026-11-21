#!/bin/sh
# Install writui (https://writui.aak.sh) on macOS or Linux:
#
#   curl -fsSL https://writui.aak.sh/install.sh | bash
#
# writui.aak.sh serves this file from the repo (github.com/aakashns/aak.sh,
# in writui/); every writui release has it attached too.
#
# Downloads the latest release for this computer, checks it against the
# release's SHA256SUMS and installs it to ~/.local/bin/writui. Running it
# again upgrades. Settings, as environment variables:
#
#   WRITUI_VERSION      install this version instead of the latest (e.g. 0.1.0)
#   WRITUI_INSTALL_DIR  install here instead of ~/.local/bin
set -eu

repo="https://github.com/aakashns/aak.sh"
docs="$repo/tree/main/writui"
# Releases up to 0.20.0 were published here, before writui moved to aak.sh.
old_repo="https://github.com/aakashns/writui"
dir="${WRITUI_INSTALL_DIR:-$HOME/.local/bin}"

fail() {
  printf 'writui install: %s\n' "$*" >&2
  exit 1
}

case "$(uname -s)" in
  Darwin) os=macos ;;
  Linux) os=linux ;;
  MINGW* | MSYS* | CYGWIN*) fail "on Windows, build writui from source: $docs#windows" ;;
  *) fail "there's no writui build for $(uname -s); see $docs#install" ;;
esac

case "$(uname -m)" in
  arm64 | aarch64) arch=arm64 ;;
  x86_64 | amd64) arch=x86_64 ;;
  *) fail "there's no writui build for $(uname -m) processors; see $docs#install" ;;
esac

# A shell running under Rosetta reports x86_64 on Apple Silicon Macs.
if [ "$os-$arch" = macos-x86_64 ] && [ "$(sysctl -n sysctl.proc_translated 2>/dev/null)" = 1 ]; then
  arch=arm64
fi

case "$os-$arch" in
  macos-arm64) label="macOS (Apple Silicon)" ;;
  macos-x86_64) label="macOS (Intel)" ;;
  linux-arm64) label="Linux (arm64)" ;;
  linux-x86_64) label="Linux (x86_64)" ;;
esac

command -v curl >/dev/null || fail "curl is needed to download writui"

binary="writui-$os-$arch"
if [ -n "${WRITUI_VERSION:-}" ]; then
  version=${WRITUI_VERSION#v}
else
  # The repo has other projects' releases too: the newest one tagged
  # writui-v* is the latest writui (GitHub lists releases newest first).
  version=$(curl -fsSL "https://api.github.com/repos/aakashns/aak.sh/releases?per_page=100" |
    grep -o '"tag_name": *"writui-v[0-9.]*"' | head -n 1 | sed 's/.*"writui-v//; s/"$//' || true)
  [ -n "$version" ] || fail "couldn't find the latest writui release on GitHub; please try again later"
fi
case "$version" in
  0.[0-9].* | 0.1[0-9].* | 0.20.*) url="$old_repo/releases/download/v$version" ;;
  *) url="$repo/releases/download/writui-v$version" ;;
esac

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo "Downloading writui for $label..."
curl -fsSL "$url/$binary" -o "$tmp/writui" || fail "couldn't download $url/$binary"
curl -fsSL "$url/SHA256SUMS" -o "$tmp/SHA256SUMS" || fail "couldn't download $url/SHA256SUMS"

expected=$(awk -v name="$binary" '$2 == name { print $1 }' "$tmp/SHA256SUMS")
if command -v shasum >/dev/null; then
  actual=$(shasum -a 256 "$tmp/writui" | cut -d ' ' -f 1)
elif command -v sha256sum >/dev/null; then
  actual=$(sha256sum "$tmp/writui" | cut -d ' ' -f 1)
else
  fail "shasum or sha256sum is needed to check the download"
fi
[ -n "$expected" ] && [ "$expected" = "$actual" ] ||
  fail "the download doesn't match its checksum; please try again"

# Copy next to the destination, then rename over it, so an existing writui is
# replaced in one step and never left half-written.
mkdir -p "$dir" || fail "couldn't create $dir"
chmod 755 "$tmp/writui"
cp "$tmp/writui" "$dir/.writui.new" || fail "couldn't write to $dir"
mv -f "$dir/.writui.new" "$dir/writui"

echo "Installed $("$dir/writui" --version) to $dir/writui"

case ":$PATH:" in
  *":$dir:"*)
    found=$(command -v writui || true)
    if [ "$found" != "$dir/writui" ]; then
      echo "Note: running \`writui\` starts $found, which comes first on your PATH."
    fi
    echo "Run \`writui\` to start writing."
    ;;
  *)
    # Show paths in the home folder as $HOME/..., as people write them.
    case "$dir" in
      "$HOME"/*) shown="\$HOME/${dir#"$HOME"/}" ;;
      *) shown="$dir" ;;
    esac
    shell=$(basename "${SHELL:-sh}")
    # The ~ is printed for the user's shell to expand, not expanded here.
    # shellcheck disable=SC2088
    case "$shell" in
      zsh) rc="~/.zshrc" ;;
      bash) if [ "$os" = macos ]; then rc="~/.bash_profile"; else rc="~/.bashrc"; fi ;;
      *) rc="" ;;
    esac
    echo
    echo "$dir isn't on your PATH yet. To add it, run:"
    echo
    if [ "$shell" = fish ]; then
      echo "  fish_add_path $dir"
    elif [ -n "$rc" ]; then
      echo "  echo 'export PATH=\"$shown:\$PATH\"' >> $rc"
    else
      echo "  export PATH=\"$shown:\$PATH\"   (and add it to your shell's startup file)"
    fi
    echo
    echo "Then open a new terminal and run \`writui\`."
    ;;
esac
