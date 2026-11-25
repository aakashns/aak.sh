// What `dui add` can copy into a project, served as JSON at /r/<name>.json, like
// shadcn/ui's registry. Paths are relative to the project's source folder, and every file is
// one in this folder, so the site uses the same code it hands out.
import { readSources } from './sources.ts' with { type: 'macro' }

// Every file in lib/ and ui/, by path, like 'ui/button.css'.
export const SOURCES = readSources('{lib,ui}/**/*')

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
  component('accordion', 'Accordion', 'Sections that open and close, on native <details>.'),
  component('alert', 'Alert', 'A callout for something to notice, like an error.'),
  component('avatar', 'Avatar', 'A round picture of someone, over their initials.'),
  component('badge', 'Badge', 'A small label, like a status.'),
  component('button', 'Button', 'A button, or a link that looks like one.'),
  component('card', 'Card', 'A box with a header, content, and footer.'),
  component('checkbox', 'Checkbox', 'A native checkbox, styled.'),
  component('dialog', 'Dialog', 'A modal on a native <dialog>, with no JavaScript.', ['button']),
  component('field', 'Field', 'A form field: a label, a control, a description, and an error.'),
  component('input', 'Input', 'A text field.'),
  component('kbd', 'Kbd', 'A key, or keys pressed together.'),
  component('label', 'Label', 'A label for a form control.'),
  component('native-select', 'Native Select', 'A native <select>, styled, with a chevron.'),
  component('progress', 'Progress', 'A native <progress> bar.'),
  component('radio-group', 'Radio Group', 'Native radio buttons, one of which is checked.'),
  component('separator', 'Separator', 'A line between things.'),
  component('skeleton', 'Skeleton', 'A pulsing placeholder for what is loading.'),
  component('switch', 'Switch', 'A checkbox that looks like a toggle.'),
  component('table', 'Table', 'A table that scrolls sideways on small screens.'),
  component('tabs', 'Tabs', 'Tabs whose state is a Datastar signal.'),
  component('textarea', 'Textarea', 'A multi-line text field that grows with its text.'),
]

export const registry = [lib, ...components]

// An item as the CLI gets it, with each file's contents.
export function registryJson(item: RegistryItem) {
  let files = item.files.map((path) => ({ path, content: SOURCES[path] ?? '' }))
  return { ...item, files }
}
