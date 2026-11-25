import { raw } from './lib/jsx/jsx-runtime.ts'
import { Button } from './ui/button.tsx'
import { DUI_CSS } from './ui/styles.ts'

const page = (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Hello, dui</title>
      <style>{raw(DUI_CSS)}</style>
      <script
        type="module"
        src="https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.4/bundles/datastar.js"
      ></script>
    </head>
    <body data-signals:count="0">
      <Button data-on:click="$count++">
        Clicked <span data-text="$count">0</span> times
      </Button>
    </body>
  </html>
)

const server = Bun.serve({
  routes: {
    '/': new Response('<!DOCTYPE html>' + page, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }),
  },
})
console.log(`Open ${server.url}`)
