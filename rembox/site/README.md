# rembox site

[rembox.aak.sh](https://rembox.aak.sh): plain HTML in `public/`, with no build step,
and `public/install.sh`, the installer. [`Caddyfile`](Caddyfile) serves it.

To preview it locally, with live reload: `npx live-server public --port=8788`

`images/render.sh` renders `public/social.png` (the link preview, from `images/social.html`),
`favicon.ico` and `apple-touch-icon.png` (from `icon.svg`). Re-run it when you change those.

## Deploying

Point rembox.aak.sh at the web server serving the other aak.sh sites. Pull main in
`/srv/aak.sh` and check that Caddy can read `rembox/site/public/index.html`.
Add the new host block from [Caddyfile](Caddyfile) to the active configuration,
validate it with `caddy validate --config /etc/caddy/Caddyfile`, and reload Caddy.
Verify the HTTPS homepage and installer. Then replace the old rembox.aakashns.com
block with the redirect, validate and reload again. Check the old installer URL
redirects to the same script, including any query string.
