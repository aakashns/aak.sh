# Collager

A single-page, local-first photo collage maker. Choose a layout for two, three, four, or six photos, pick a frame and color, and download or share a 2400 × 1800 PNG. Photos are cropped to fill their cells. The editor holds uploaded pictures in browser memory until you leave or reload.

## Run a preview

Set `COLLAGER_PREVIEW_PASSWORD` in your environment, then run `python3 site/preview.py` from this directory. Open `http://127.0.0.1:4183` and sign in as `collager` with that password. Use HTTPS when exposing the preview through a tunnel.

## Publish

Publish the contents of `site/public/` at `https://collager.aak.sh/` using any static host. The editor needs no API, database, or sign-in. The example in `site/Caddyfile` serves just those files. If publishing on another domain, update the absolute URLs in `index.html`, `sitemap.xml`, and `robots.txt`.

On HTTPS, **Share collage** passes the PNG to the device share sheet when file sharing is available. **How to use → Add to Home Screen** opens the install prompt or gives browser-specific steps.

## Sample photography

The bundled travel photos are sourced from Unsplash. The editor loads them locally.

- [Coastal village](https://images.unsplash.com/photo-1516483638261-f4dbaf036963)
- [Fruit bowl](https://images.unsplash.com/photo-1519996529931-28324d5a630e)
- [Seaside steps](https://images.unsplash.com/photo-1533105079780-92b9be482077)
- [Italian coast](https://images.unsplash.com/photo-1499678329028-101435549a4e)
- [Mountain lake](https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1)
- [Mountain valley](https://images.unsplash.com/photo-1472396961693-142e6e269027)
