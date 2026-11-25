// A block of code, highlighted on the server, with a button that copies it, using Datastar for
// the click.
import { highlight } from 'sugar-high'

import { escapeHtml, raw, type Child, type Html } from '../lib/jsx/jsx-runtime.ts'

const COPY = `navigator.clipboard.writeText(el.closest('.code').querySelector('code').textContent); el.dataset.copied = ''; setTimeout(() => delete el.dataset.copied, 2000)`

// TSX by sugar-high, its colors left to site.css's classes; shell commands get their own.
const HIGHLIGHT = {
  tsx: (code: string) => highlight(code).replace(/ style="color:var\(--sh-\w+\)"/g, ''),
  sh: (code: string) =>
    escapeHtml(code)
      .replace(/(^|\| )([\w.-]+)/gm, '$1<span class="sh__token--entity">$2</span>')
      .replace(/ (--?[\w-]+)/g, ' <span class="sh__token--property">$1</span>'),
}

export function CodeBlock(props: {
  code: string
  lang: keyof typeof HIGHLIGHT
  title?: Child
  class?: string
}): Html {
  let { code, lang, title, class: className } = props
  return (
    <div class={className ? `code ${className}` : 'code'}>
      {title ? <div class="code-title">{title}</div> : null}
      <pre>
        <code>{raw(HIGHLIGHT[lang](code))}</code>
      </pre>
      <button type="button" class="copy" aria-label="Copy code" data-on:click={COPY}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </button>
    </div>
  )
}
