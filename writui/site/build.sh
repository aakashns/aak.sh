#!/usr/bin/env bash
# Builds the site into site/public (not committed). On the server, run this
# after pulling; Caddy serves site/public (see Caddyfile). It uses this exact
# Zola version, so every build matches: your own zola if it's that version,
# otherwise it downloads it once (macOS or Linux) into site/.zola/.
set -euo pipefail
cd "$(dirname "$0")"

version=v0.23.6
zola=zola
if [ "$(zola --version 2>/dev/null)" != "zola ${version#v}" ]; then
  zola=".zola/$version/zola"
  if [ ! -x "$zola" ]; then
    case "$(uname -s)" in
      Darwin) platform=apple-darwin ;;
      Linux) platform=unknown-linux-gnu ;;
      *) echo "build.sh: install zola $version yourself" >&2; exit 1 ;;
    esac
    arch=$(uname -m)
    [ "$arch" = arm64 ] && arch=aarch64
    mkdir -p ".zola/$version"
    curl -fsSL "https://github.com/getzola/zola/releases/download/$version/zola-$version-$arch-$platform.tar.gz" \
      | tar xz -C ".zola/$version" zola
  fi
fi
"$zola" --version
"$zola" build
