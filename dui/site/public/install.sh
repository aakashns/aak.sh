#!/bin/sh
# Installs dui (https://dui.aak.sh) on Linux or macOS:
#
#   curl -fsSL https://dui.aak.sh/install.sh | sh
#
# Downloads the release dui.aak.sh runs (or DUI_VERSION's), checks it against the release's
# SHA256SUMS, and installs it at /usr/local/bin/dui (or in DUI_INSTALL_DIR), with sudo if that
# folder needs it. Running it again upgrades.
set -eu

version=${DUI_VERSION:-__DUI_VERSION__}
dir=${DUI_INSTALL_DIR:-/usr/local/bin}

fail() {
  printf 'dui install: %s\n' "$*" >&2
  exit 1
}

# The site fills in its own version; this file as it is in the repo needs DUI_VERSION.
case "$version" in
  [0-9]*.[0-9]*.[0-9]*) ;;
  *) fail "set DUI_VERSION to the version to install, e.g. DUI_VERSION=0.1.0" ;;
esac

case "$(uname -s)" in
  Darwin) os=darwin ;;
  Linux) os=linux ;;
  *) fail "there's no dui build for $(uname -s)" ;;
esac

case "$(uname -m)" in
  arm64 | aarch64) arch=arm64 ;;
  x86_64 | amd64) arch=x64 ;;
  *) fail "there's no dui build for $(uname -m) processors" ;;
esac

# A shell running under Rosetta reports x86_64 on Apple Silicon Macs.
if [ "$os-$arch" = darwin-x64 ] && [ "$(sysctl -n sysctl.proc_translated 2>/dev/null)" = 1 ]; then
  arch=arm64
fi

binary="dui-$os-$arch"
url="https://github.com/aakashns/aak.sh/releases/download/dui-v$version"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo "Downloading $url/$binary..."
curl -fsSL "$url/$binary" -o "$tmp/dui" || fail "couldn't download $url/$binary"
curl -fsSL "$url/SHA256SUMS" -o "$tmp/SHA256SUMS" || fail "couldn't download $url/SHA256SUMS"

expected=$(awk -v name="$binary" '$2 == name { print $1 }' "$tmp/SHA256SUMS")
if command -v sha256sum >/dev/null; then
  actual=$(sha256sum "$tmp/dui" | cut -d ' ' -f 1)
else
  actual=$(shasum -a 256 "$tmp/dui" | cut -d ' ' -f 1)
fi
[ -n "$expected" ] && [ "$expected" = "$actual" ] ||
  fail "the download doesn't match its checksum; please try again"
chmod 755 "$tmp/dui"

sudo=
if [ "$(id -u)" != 0 ] && ! { mkdir -p "$dir" 2>/dev/null && [ -w "$dir" ]; }; then
  command -v sudo >/dev/null || fail "can't write to $dir; run this as root"
  echo "Installing at $dir/dui needs sudo"
  sudo=sudo
fi

# Copied beside it, then renamed over it, so a running dui keeps its copy.
$sudo mkdir -p "$dir"
$sudo cp "$tmp/dui" "$dir/.dui.new"
$sudo mv -f "$dir/.dui.new" "$dir/dui"

echo "Installed dui $("$dir/dui" version) at $dir/dui. Next: dui add button"
