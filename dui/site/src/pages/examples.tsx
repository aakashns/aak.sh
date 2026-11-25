// Each component's examples, rendered live on its docs page above their code, and how it differs
// from shadcn/ui's. An example is a file in examples/, so what the page shows and the code it
// shows are the same.
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import { readSources } from '../sources.ts' with { type: 'macro' }
import accordionDemo from '../examples/accordion-demo.tsx'
import accordionMultiple from '../examples/accordion-multiple.tsx'
import alertDemo from '../examples/alert-demo.tsx'
import alertDestructive from '../examples/alert-destructive.tsx'
import alertTitleOnly from '../examples/alert-title-only.tsx'
import avatarDemo from '../examples/avatar-demo.tsx'
import avatarGroup from '../examples/avatar-group.tsx'
import avatarSizes from '../examples/avatar-sizes.tsx'
import badgeDemo from '../examples/badge-demo.tsx'
import badgeIcon from '../examples/badge-icon.tsx'
import badgeLink from '../examples/badge-link.tsx'
import buttonDatastar from '../examples/button-datastar.tsx'
import buttonDemo from '../examples/button-demo.tsx'
import buttonDisabled from '../examples/button-disabled.tsx'
import buttonLink from '../examples/button-link.tsx'
import buttonSizes from '../examples/button-sizes.tsx'
import buttonVariants from '../examples/button-variants.tsx'
import buttonWithIcon from '../examples/button-with-icon.tsx'
import cardDemo from '../examples/card-demo.tsx'
import cardSimple from '../examples/card-simple.tsx'
import checkboxDatastar from '../examples/checkbox-datastar.tsx'
import checkboxDemo from '../examples/checkbox-demo.tsx'
import checkboxDescription from '../examples/checkbox-description.tsx'
import dialogConfirm from '../examples/dialog-confirm.tsx'
import dialogDatastar from '../examples/dialog-datastar.tsx'
import dialogDemo from '../examples/dialog-demo.tsx'
import fieldChoiceCard from '../examples/field-choice-card.tsx'
import fieldDemo from '../examples/field-demo.tsx'
import fieldErrors from '../examples/field-errors.tsx'
import fieldInput from '../examples/field-input.tsx'
import fieldResponsive from '../examples/field-responsive.tsx'
import fieldValidation from '../examples/field-validation.tsx'
import inputDatastar from '../examples/input-datastar.tsx'
import inputDemo from '../examples/input-demo.tsx'
import inputFile from '../examples/input-file.tsx'
import inputStates from '../examples/input-states.tsx'
import inputWithButton from '../examples/input-with-button.tsx'
import inputWithLabel from '../examples/input-with-label.tsx'
import kbdDemo from '../examples/kbd-demo.tsx'
import kbdInText from '../examples/kbd-in-text.tsx'
import labelDemo from '../examples/label-demo.tsx'
import labelWrapping from '../examples/label-wrapping.tsx'
import nativeSelectDatastar from '../examples/native-select-datastar.tsx'
import nativeSelectDemo from '../examples/native-select-demo.tsx'
import nativeSelectGroups from '../examples/native-select-groups.tsx'
import nativeSelectStates from '../examples/native-select-states.tsx'
import progressDatastar from '../examples/progress-datastar.tsx'
import progressDemo from '../examples/progress-demo.tsx'
import progressIndeterminate from '../examples/progress-indeterminate.tsx'
import radioGroupDatastar from '../examples/radio-group-datastar.tsx'
import radioGroupDemo from '../examples/radio-group-demo.tsx'
import radioGroupDescription from '../examples/radio-group-description.tsx'
import separatorDemo from '../examples/separator-demo.tsx'
import skeletonCard from '../examples/skeleton-card.tsx'
import skeletonDemo from '../examples/skeleton-demo.tsx'
import switchDatastar from '../examples/switch-datastar.tsx'
import switchDemo from '../examples/switch-demo.tsx'
import switchDisabled from '../examples/switch-disabled.tsx'
import switchField from '../examples/switch-field.tsx'
import tableDemo from '../examples/table-demo.tsx'
import tableRich from '../examples/table-rich.tsx'
import tabsDemo from '../examples/tabs-demo.tsx'
import tabsSignal from '../examples/tabs-signal.tsx'
import textareaDatastar from '../examples/textarea-datastar.tsx'
import textareaDemo from '../examples/textarea-demo.tsx'
import textareaField from '../examples/textarea-field.tsx'
import textareaStates from '../examples/textarea-states.tsx'

const CODE = readSources('examples/*.tsx')

export interface Example {
  slug: string
  title: string
  render: () => Html
  // The file's code, importing from ./ui/ as it would from a project's src/.
  code: string
  // The components it imports, like ['button', 'input'].
  uses: string[]
}

const example = (file: string, title: string, render: () => Html): Example => {
  let source = CODE[`examples/${file}.tsx`] ?? ''
  return {
    slug: file,
    title,
    render,
    code: source.replaceAll("from '../", "from './"),
    uses: [...source.matchAll(/from '\.\.\/ui\/([\w-]+)\.tsx'/g)].map((m) => m[1]!),
  }
}

export interface ComponentDocs {
  // The first is the page's demo.
  examples: Example[]
  // How dui's version differs from shadcn/ui's.
  shadcn: Child[]
}

export const docs: Record<string, ComponentDocs> = {
  accordion: {
    examples: [
      example('accordion-demo', 'One open at a time', accordionDemo),
      example('accordion-multiple', 'Any number open', accordionMultiple),
    ],
    shadcn: [
      <>
        Native <code>&lt;details&gt;</code> and <code>&lt;summary&gt;</code> instead of Radix's
        Accordion, so it opens and closes with no JavaScript, and find-in-page opens the item it
        finds text in.
      </>,
      <>
        <code>type="single"</code> is items with the same <code>name</code>;{' '}
        <code>type="multiple"</code> is items without one. Single ones are always collapsible.
      </>,
      <>
        <code>defaultValue</code> is <code>open</code> on the item, and there's no controlled{' '}
        <code>value</code>.
      </>,
      <>
        It animates with <code>::details-content</code> and <code>interpolate-size</code>, where
        browsers support them (Chrome and Edge, for now), and opens instantly elsewhere.
      </>,
    ],
  },
  alert: {
    examples: [
      example('alert-demo', 'Default', alertDemo),
      example('alert-destructive', 'Destructive', alertDestructive),
      example('alert-title-only', 'Title only', alertTitleOnly),
    ],
    shadcn: [
      'The same parts, variants, and grid: an icon, if the alert starts with an <svg>, gets the first column.',
      <>
        Bring your own icons as inline SVG: there's no <code>lucide-react</code>.
      </>,
    ],
  },
  avatar: {
    examples: [
      example('avatar-demo', 'Image and fallback', avatarDemo),
      example('avatar-group', 'Group', avatarGroup),
      example('avatar-sizes', 'Sizes', avatarSizes),
    ],
    shadcn: [
      "Radix shows the fallback until the image loads, with JavaScript. dui stacks the image on top of the fallback in one grid cell, and hides a broken image's alt text, so the fallback shows through.",
      <>
        No <code>delayMs</code>: the fallback is there from the start, under the image.
      </>,
      <>
        Resize it with <code>style</code> or a class, as with shadcn's <code>size-*</code>.
      </>,
    ],
  },
  badge: {
    examples: [
      example('badge-demo', 'Variants', badgeDemo),
      example('badge-icon', 'With an icon, and as a count', badgeIcon),
      example('badge-link', 'As a link', badgeLink),
    ],
    shadcn: [
      'The same four variants.',
      <>
        No <code>asChild</code>: give it an <code>href</code> and it's an <code>&lt;a&gt;</code>,
        with a hover color as shadcn's has for links.
      </>,
    ],
  },
  button: {
    examples: [
      example('button-demo', 'Default', buttonDemo),
      example('button-variants', 'Variants', buttonVariants),
      example('button-sizes', 'Sizes', buttonSizes),
      example('button-with-icon', 'With an icon', buttonWithIcon),
      example('button-link', 'As a link', buttonLink),
      example('button-disabled', 'Disabled', buttonDisabled),
      example('button-datastar', 'With Datastar', buttonDatastar),
    ],
    shadcn: [
      <>
        The same variants, and the <code>sm</code>, <code>default</code>, <code>lg</code>, and{' '}
        <code>icon</code> sizes. There's no <code>icon-sm</code> or <code>icon-lg</code>.
      </>,
      <>
        No <code>asChild</code>: give it an <code>href</code> and it's an <code>&lt;a&gt;</code>.
        For anything else, put <code>data-slot="button"</code> and a <code>data-variant</code> on
        it.
      </>,
      <>
        It's <code>type="button"</code> unless you say otherwise, so it doesn't submit a form by
        accident. Give it <code>type="submit"</code> to.
      </>,
      <>
        Events are Datastar attributes like <code>data-on:click</code>, not React's{' '}
        <code>onClick</code>.
      </>,
    ],
  },
  card: {
    examples: [
      example('card-demo', 'With a form', cardDemo),
      example('card-simple', 'Simple', cardSimple),
    ],
    shadcn: [
      <>
        No <code>CardAction</code>, for a button in the header's corner: lay out the header
        yourself.
      </>,
      <>
        <code>CardTitle</code> is a <code>&lt;div&gt;</code>, as shadcn's is; give it{' '}
        <code>as="h2"</code> or <code>as="h3"</code> when it starts a section.
      </>,
    ],
  },
  checkbox: {
    examples: [
      example('checkbox-demo', 'Default', checkboxDemo),
      example('checkbox-description', 'With a description', checkboxDescription),
      example('checkbox-datastar', 'With Datastar', checkboxDatastar),
    ],
    shadcn: [
      <>
        A native <code>&lt;input type="checkbox"&gt;</code> instead of Radix's button and hidden
        input: it's sent with its form and works without JavaScript.
      </>,
      <>
        <code>checked</code> is the attribute; <code>onCheckedChange</code> is{' '}
        <code>data-bind</code> or <code>data-on:change</code>.
      </>,
      <>
        Indeterminate is the input's property, not an attribute: set it with Datastar, like{' '}
        <code>data-effect="el.indeterminate = $some &amp;&amp; !$all"</code>.
      </>,
    ],
  },
  dialog: {
    examples: [
      example('dialog-demo', 'With a form', dialogDemo),
      example('dialog-confirm', 'Confirm, without the ×', dialogConfirm),
      example('dialog-datastar', 'With Datastar', dialogDatastar),
    ],
    shadcn: [
      <>
        A native <code>&lt;dialog&gt;</code> opened by invoker commands (<code>command</code> and{' '}
        <code>commandfor</code>) instead of Radix and React state: no JavaScript, and the browser
        traps focus, closes it on Escape, and gives focus back to the trigger.
      </>,
      <>
        The trigger points at the dialog's <code>id</code> instead of sitting in a{' '}
        <code>&lt;Dialog&gt;</code> with it. The title and description are props, so there's no{' '}
        <code>DialogContent</code>, <code>DialogHeader</code>, <code>DialogTitle</code>, or{' '}
        <code>DialogDescription</code>.
      </>,
      <>
        <code>showCloseButton</code> works as shadcn's does. Clicking outside closes it with{' '}
        <code>closedby="any"</code>, where browsers support it (not Safari yet).
      </>,
      <>
        There's no <code>open</code> prop: open it from a script with{' '}
        <code>document.getElementById('id').showModal()</code>, and a{' '}
        <code>&lt;form method="dialog"&gt;</code> inside closes it when it's submitted.
      </>,
      'Needs a browser with invoker commands: Chrome and Edge 135, Firefox 144, and Safari 26.2.',
    ],
  },
  field: {
    examples: [
      example('field-demo', 'A whole form', fieldDemo),
      example('field-input', 'Input', fieldInput),
      example('field-validation', 'Checked as you type, with Datastar', fieldValidation),
      example('field-errors', 'Errors from the server', fieldErrors),
      example('field-choice-card', 'Choice cards', fieldChoiceCard),
      example('field-responsive', 'Responsive', fieldResponsive),
    ],
    shadcn: [
      <>
        The same parts and layout: <code>Field</code> with its three orientations,{' '}
        <code>FieldSet</code>, <code>FieldLegend</code>, <code>FieldGroup</code>,{' '}
        <code>FieldContent</code>, <code>FieldLabel</code>, <code>FieldTitle</code>,{' '}
        <code>FieldDescription</code>, <code>FieldSeparator</code>, and <code>FieldError</code>.
      </>,
      <>
        <code>FieldLabel</code> is a <code>&lt;label&gt;</code> of its own, so Field doesn't need
        Label or Separator.
      </>,
      <>
        <code>FieldError</code>'s <code>errors</code> are strings, not <code>{'{ message }'}</code>{' '}
        objects from a form library. Validate on the server, or with Datastar, and set{' '}
        <code>data-invalid</code> on the field.
      </>,
      <>
        There's no checkbox group component: use{' '}
        <code>&lt;FieldGroup data-slot="checkbox-group"&gt;</code>, as shadcn's examples do.
      </>,
    ],
  },
  input: {
    examples: [
      example('input-demo', 'Default', inputDemo),
      example('input-with-label', 'With a label', inputWithLabel),
      example('input-with-button', 'With a button', inputWithButton),
      example('input-file', 'File', inputFile),
      example('input-states', 'Disabled and invalid', inputStates),
      example('input-datastar', 'With Datastar', inputDatastar),
    ],
    shadcn: [
      "The same look, on a plain <input>: its text is 1rem on phones, so iOS doesn't zoom in.",
      <>
        <code>value</code> and <code>onChange</code> are <code>value</code> and Datastar's{' '}
        <code>data-bind</code>.
      </>,
    ],
  },
  kbd: {
    examples: [example('kbd-demo', 'Keys', kbdDemo), example('kbd-in-text', 'In text', kbdInText)],
    shadcn: [
      <>
        The same <code>Kbd</code> and <code>KbdGroup</code>, on <code>&lt;kbd&gt;</code>.
      </>,
    ],
  },
  label: {
    examples: [
      example('label-demo', 'Default', labelDemo),
      example('label-wrapping', 'Around its control', labelWrapping),
    ],
    shadcn: [
      <>
        A plain <code>&lt;label&gt;</code> instead of Radix's Label.
      </>,
      <>
        It looks disabled when its control is: one inside it, or one just before it (shadcn's{' '}
        <code>peer-disabled</code>).
      </>,
    ],
  },
  'native-select': {
    examples: [
      example('native-select-demo', 'Default', nativeSelectDemo),
      example('native-select-groups', 'Groups', nativeSelectGroups),
      example('native-select-states', 'Small, disabled, and invalid', nativeSelectStates),
      example('native-select-datastar', 'With Datastar', nativeSelectDatastar),
    ],
    shadcn: [
      <>
        The same as shadcn's Native Select: <code>NativeSelect</code>,{' '}
        <code>NativeSelectOption</code>, <code>NativeSelectOptGroup</code>, and the <code>sm</code>{' '}
        size.
      </>,
      <>
        dui has no Radix-style <code>Select</code>, with a list it draws itself. The native one
        opens the phone's own picker and needs no JavaScript.
      </>,
    ],
  },
  progress: {
    examples: [
      example('progress-demo', 'Default', progressDemo),
      example('progress-datastar', 'With Datastar', progressDatastar),
      example('progress-indeterminate', 'Indeterminate', progressIndeterminate),
    ],
    shadcn: [
      <>
        A native <code>&lt;progress&gt;</code> instead of Radix's: assistive technology reads it as
        it is, and without a <code>value</code> it's indeterminate.
      </>,
      <>
        <code>value</code> is out of 100, or of <code>max</code>. Move it with{' '}
        <code>data-attr:value</code>.
      </>,
    ],
  },
  'radio-group': {
    examples: [
      example('radio-group-demo', 'Default', radioGroupDemo),
      example('radio-group-description', 'With descriptions', radioGroupDescription),
      example('radio-group-datastar', 'With Datastar', radioGroupDatastar),
    ],
    shadcn: [
      <>
        Native radio buttons, with the same <code>name</code>, instead of Radix's: the browser moves
        between them with the arrow keys, and sends the checked one with the form.
      </>,
      <>
        The group's <code>value</code> and <code>onValueChange</code> are <code>checked</code> on an
        item, and a <code>data-bind</code> on each to one signal.
      </>,
    ],
  },
  separator: {
    examples: [example('separator-demo', 'Horizontal and vertical', separatorDemo)],
    shadcn: [
      <>
        The same <code>orientation</code> and <code>decorative</code> props; decorative ones are
        hidden from assistive technology.
      </>,
    ],
  },
  skeleton: {
    examples: [
      example('skeleton-demo', 'Default', skeletonDemo),
      example('skeleton-card', 'Card', skeletonCard),
    ],
    shadcn: [
      <>
        The same pulse. Size it with <code>style</code> or a class. It stays still for people who
        ask for reduced motion.
      </>,
    ],
  },
  switch: {
    examples: [
      example('switch-demo', 'Default', switchDemo),
      example('switch-field', 'In a field', switchField),
      example('switch-disabled', 'Disabled', switchDisabled),
      example('switch-datastar', 'With Datastar', switchDatastar),
    ],
    shadcn: [
      <>
        A native checkbox with <code>role="switch"</code> instead of Radix's button and hidden
        input: it's sent with its form and works without JavaScript.
      </>,
      <>
        <code>checked</code> is the attribute; <code>onCheckedChange</code> is{' '}
        <code>data-bind</code> or <code>data-on:change</code>.
      </>,
    ],
  },
  table: {
    examples: [
      example('table-demo', 'Invoices', tableDemo),
      example('table-rich', 'With checkboxes, avatars, and badges', tableRich),
    ],
    shadcn: ["The same parts and look, and it scrolls sideways when it doesn't fit."],
  },
  tabs: {
    examples: [
      example('tabs-demo', 'Default', tabsDemo),
      example('tabs-signal', 'Driven by a signal', tabsSignal),
    ],
    shadcn: [
      <>
        Make a set with <code>createTabs(signal, defaultValue)</code>, instead of giving{' '}
        <code>Tabs</code> a <code>defaultValue</code>: each part needs to know the signal, and the
        page is rendered showing the tab it starts on.
      </>,
      <>
        The open tab is a Datastar signal, so anything on the page can read it or switch tabs, where
        shadcn has <code>value</code> and <code>onValueChange</code>.
      </>,
      <>
        The keyboard works as Radix's does, horizontally: the open tab is the list's one stop in the
        Tab order, and the arrow keys, Home, and End move between tabs and open them. Give{' '}
        <code>TabsList</code> an <code>aria-label</code>. Closed panels are hidden from everyone.
      </>,
      <>
        The signal names the parts' ids, so each set on a page needs a signal of its own. Two sets
        with one signal would also open and close together.
      </>,
    ],
  },
  textarea: {
    examples: [
      example('textarea-demo', 'Default', textareaDemo),
      example('textarea-field', 'In a field', textareaField),
      example('textarea-states', 'Filled, disabled, and invalid', textareaStates),
      example('textarea-datastar', 'With Datastar', textareaDatastar),
    ],
    shadcn: [
      <>
        The same look, and it grows with its text (<code>field-sizing: content</code>) as shadcn's
        does.
      </>,
      <>
        Its <code>value</code> prop is the text inside it, as a <code>&lt;textarea&gt;</code> has no
        value attribute.
      </>,
    ],
  },
}
