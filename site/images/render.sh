#!/bin/sh
# Renders the site's images into ../public with Playwright's Chromium (`npx playwright install
# chromium`; set PLAYWRIGHT to use another playwright command):
# social.png from social.html, and the PNG and ICO icons from public/icon.svg.
set -eu
pw=${PLAYWRIGHT:-npx playwright}
cd "$(dirname "$0")"
public=../public
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

shot() { # shot SIZE HTML OUT
  printf '%s' "$2" > "$tmp/page.html"
  $pw screenshot --viewport-size "$1" "file://$tmp/page.html" "$3" > /dev/null
}

$pw screenshot --viewport-size 1200,630 "file://$PWD/social.html" "$public/social.png" > /dev/null

icon=$(cat "$public/icon.svg")
# Square, without the rounded corners: screenshots can't be transparent, and iOS rounds them itself.
square="${icon%%rx=*}${icon#*rx=\"7\" }"
for size in 16 32 48 180; do
  shot "$size,$size" "<style>body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>$square" "$tmp/$size.png"
done
cp "$tmp/180.png" "$public/apple-touch-icon.png"
python3 -I - "$tmp" "$public/favicon.ico" <<'PY'
import struct, sys
tmp, out = sys.argv[1:]
pngs = [(s, open(f"{tmp}/{s}.png", "rb").read()) for s in (16, 32, 48)]
data = struct.pack("<HHH", 0, 1, len(pngs))
offset = 6 + 16 * len(pngs)
for s, png in pngs:
    data += struct.pack("<BBBBHHII", s, s, 0, 0, 1, 32, len(png), offset)
    offset += len(png)
open(out, "wb").write(data + b"".join(png for _, png in pngs))
PY
