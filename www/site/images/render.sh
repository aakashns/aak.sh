#!/bin/sh
# Renders public/social.png (the link preview) from social.html with Playwright's Chromium
# (`npx playwright install chromium`; set PLAYWRIGHT to use another playwright command).
set -eu
pw=${PLAYWRIGHT:-npx playwright}
cd "$(dirname "$0")"
$pw screenshot --viewport-size 1200,630 "file://$PWD/social.html" ../public/social.png > /dev/null
