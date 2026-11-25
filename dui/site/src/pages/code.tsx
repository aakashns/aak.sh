// A block of code with a button that copies it, using Datastar for the click.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'

const COPY = `navigator.clipboard.writeText(el.closest('.code').querySelector('code').textContent); el.dataset.copied = ''; setTimeout(() => delete el.dataset.copied, 2000)`

export function CodeBlock(props: { code: string; title?: Child; class?: string }): Html {
  let { code, title, class: className } = props
  return (
    <div class={className ? `code ${className}` : 'code'}>
      {title ? <div class="code-title">{title}</div> : null}
      <pre>
        <code>{code}</code>
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
