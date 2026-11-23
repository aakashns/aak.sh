# www

[aak.sh](https://aak.sh), the landing page that lists every project in this repo.

It's a single plain HTML page, [`site/public/index.html`](site/public/index.html), with no build step.
[`site/Caddyfile`](site/Caddyfile) serves it, and sends www.aak.sh and unknown paths to the homepage.

To preview it locally, with live reload: `npx live-server site/public --port=8788`

## Adding a project

Add a card to `index.html` with the project's icon and its description from the
[top-level README](../README.md). Then add the project to the page's meta description, the
`og:description` and the social card. Keep the cards ordered by how impressive the projects are.

## Images

- `favicon.ico`, `apple-touch-icon.png` and `icon.png` are the "a" mark from [aakashns.com](https://aakashns.com).
- `site/images/render.sh` renders `social.png` (the link preview) from `site/images/social.html`.
  Re-run it when you change the projects or the headline.

## Deploying

The server pulls main into `/srv/aak.sh`. Changes to the page go live on the next pull.
When `site/Caddyfile` changes, copy its blocks into the server's main Caddyfile, check it with
`caddy validate --config /etc/caddy/Caddyfile`, and reload Caddy.
