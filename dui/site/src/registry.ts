// What `npx @aakashns/dui add` can copy into a project, served as JSON at /r/<name>.json, like
// shadcn/ui's registry. Paths are relative to the project's source folder, and every file is
// one in this folder, so the site uses the same code it hands out.
import { readSources } from './sources.ts' with { type: 'macro' }

const SOURCES = readSources()

export interface RegistryItem {
  name: string
  title: string
  description: string
  files: string[]
  registryDependencies: string[]
}

const component = (name: string, title: string, description: string, deps: string[] = []) => ({
  name,
  title,
  description,
  files: [`ui/${name}.tsx`, `ui/${name}.css`],
  registryDependencies: ['lib', ...deps],
})

export const lib: RegistryItem = {
  name: 'lib',
  title: 'Lib',
  description: 'The JSX runtime that renders straight to HTML strings, and the theme.',
  files: ['lib/jsx/jsx-runtime.ts', 'lib/jsx/jsx-dev-runtime.ts', 'lib/css.d.ts', 'lib/theme.css'],
  registryDependencies: [],
}

export const components: RegistryItem[] = [
  component('button', 'Button', 'A button, or a link that looks like one.'),
  component('card', 'Card', 'A box with a header, content, and footer.'),
  component('dialog', 'Dialog', 'A modal on a native <dialog>, with no JavaScript.', ['button']),
  component('input', 'Input', 'A text field.'),
  component('switch', 'Switch', 'A checkbox that looks like a toggle.'),
]

export const registry = [lib, ...components]

// An item as the CLI gets it, with each file's contents.
export function registryJson(item: RegistryItem) {
  let files = item.files.map((path) => ({ path, content: SOURCES[path] ?? '' }))
  return { ...item, files }
}
