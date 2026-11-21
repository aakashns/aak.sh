# LogSpace website

[logspace.aak.sh](https://logspace.aak.sh) and its installer. To work on it, see
[Website in CONTRIBUTING.md](../CONTRIBUTING.md#website).

## Deploy and redirect

1. Use a merge commit to preserve the imported Git history, then wait for the monorepo's
   `logspace-v0.7.25` release.
2. Publish the same four binaries and `SHA256SUMS` as `v0.7.25` in `aakashns/logspace`.
   Make it the latest release there so older installations can reach the bridge with
   `logspace upgrade`. Keep the older releases available for pinned installs.
3. On the web server, pull `main`, then run `bun install --frozen-lockfile` and
   `bun run build` in `logspace/site`. Copy the new site's block from
   [Caddyfile](Caddyfile) into the server's Caddyfile. Run
   `caddy validate --config /etc/caddy/Caddyfile` before reloading, then reload Caddy
   once the new domain points at that server.
4. Verify the new site's homepage and `/install.sh`, then enable the old-domain
   redirect in Caddy and update the old domains' DNS. Check that the old install
   URL redirects to the new one. Retire the old Cloudflare site after the redirect works.
