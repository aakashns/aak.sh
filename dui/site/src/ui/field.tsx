// A form field and its parts: a label, a control, a description, and an error, laid out
// vertically, side by side, or (`orientation="responsive"`) side by side on wider screens.
// FieldSet and FieldLegend group fields under a heading, and FieldGroup spaces them out.
//
//   <Field>
//     <FieldLabel for="email">Email</FieldLabel>
//     <Input id="email" type="email" />
//     <FieldDescription>We'll never share it.</FieldDescription>
//   </Field>
import type { Child, Html } from '../lib/jsx/jsx-runtime.ts'
import css from './field.css' with { type: 'text' }

export const FIELD_CSS = css

type Props = Record<string, unknown> & { children?: Child }

const part =
  (tag: string, slot: string, defaults: Record<string, unknown> = {}) =>
  (props: Props): Html => {
    let { children, ...attributes } = props
    let Tag = tag
    return (
      <Tag data-slot={slot} {...defaults} {...attributes}>
        {children}
      </Tag>
    )
  }

export const FieldSet = part('fieldset', 'field-set')
export const FieldGroup = part('div', 'field-group')
export const FieldContent = part('div', 'field-content')
export const FieldLabel = part('label', 'field-label')
export const FieldTitle = part('div', 'field-title')
export const FieldDescription = part('p', 'field-description')

// `variant="label"` makes the legend the size of a label, for a set inside a field.
export function FieldLegend(props: Props & { variant?: 'legend' | 'label' | undefined }): Html {
  let { variant = 'legend', children, ...attributes } = props
  return (
    <legend data-slot="field-legend" data-variant={variant} {...attributes}>
      {children}
    </legend>
  )
}

// Set `data-invalid` on a field whose value is wrong, to color its label and description.
export function Field(
  props: Props & { orientation?: 'vertical' | 'horizontal' | 'responsive' | undefined },
): Html {
  let { orientation = 'vertical', children, ...attributes } = props
  return (
    <div role="group" data-slot="field" data-orientation={orientation} {...attributes}>
      {children}
    </div>
  )
}

// A line between fields, with optional text in the middle, like "Or".
export function FieldSeparator(props: Props): Html {
  let { children, ...attributes } = props
  return (
    <div data-slot="field-separator" data-content={children != null} {...attributes}>
      {children != null ? <span data-slot="field-separator-content">{children}</span> : null}
    </div>
  )
}

// The field's error: its children, or a list of `errors` (one shows on its own). Datastar's
// `data-show` or `data-text` can show and fill it as the value changes.
export function FieldError(props: Props & { errors?: string[] | undefined }): Html {
  let { errors, children, ...attributes } = props
  let content: Child = children
  if (content == null && errors?.length) {
    content =
      errors.length === 1 ? (
        errors[0]
      ) : (
        <ul>
          {errors.map((error) => (
            <li>{error}</li>
          ))}
        </ul>
      )
  }
  return (
    <div role="alert" data-slot="field-error" {...attributes}>
      {content}
    </div>
  )
}
