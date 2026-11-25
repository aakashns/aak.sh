// Edits JSON with comments and trailing commas, like tsconfig.json, by changing only the text of
// the values it sets, so the file's comments and formatting stay as they are.

// A value in the text, from start to end. An object's properties are in order, with where its
// braces are.
type Node =
  | { kind: 'object'; start: number; end: number; props: { key: string; value: Node }[] }
  | { kind: 'other'; start: number; end: number }

export function parse(text: string): Node {
  let i = 0
  const fail = (what: string): never => {
    let line = text.slice(0, i).split('\n').length
    throw new Error(`${what} on line ${line}`)
  }
  // Whitespace and comments.
  const skip = () => {
    for (;;) {
      let rest = /^(\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/.exec(text.slice(i))
      if (!rest) return
      i += rest[0].length
    }
  }
  const string = () => {
    let match = /^"(?:[^"\\\n]|\\.)*"/.exec(text.slice(i))
    if (!match) fail('expected a string')
    i += match![0].length
    return JSON.parse(match![0]) as string
  }
  const value = (): Node => {
    skip()
    let start = i
    let c = text[i]
    if (c === '{') {
      i++
      let props: { key: string; value: Node }[] = []
      for (;;) {
        skip()
        if (text[i] === '}') break
        let key = string()
        skip()
        if (text[i++] !== ':') fail('expected ":"')
        props.push({ key, value: value() })
        skip()
        if (text[i] === ',') i++
        else if (text[i] !== '}') fail('expected "," or "}"')
      }
      i++
      return { kind: 'object', start, end: i, props }
    }
    if (c === '[') {
      i++
      for (;;) {
        skip()
        if (text[i] === ']') break
        value()
        skip()
        if (text[i] === ',') i++
        else if (text[i] !== ']') fail('expected "," or "]"')
      }
      i++
    } else if (c === '"') string()
    else {
      let literal = /^(true|false|null|-?\d[\d.eE+-]*)/.exec(text.slice(i))
      if (!literal) fail('expected a value')
      i += literal![0].length
    }
    return { kind: 'other', start, end: i }
  }
  let root = value()
  skip()
  if (i < text.length) fail('unexpected text')
  return root
}

// Sets `path` (like ['compilerOptions', 'jsx']) to `value` in the text, adding the properties on
// the way that are missing. Each object along the way has to be one.
export function set(text: string, path: string[], value: unknown): string {
  let node = parse(text)
  let depth = 0
  for (let key of path) {
    if (node.kind !== 'object') {
      throw new Error(`${path.slice(0, depth).join('.') || 'the file'} isn't an object`)
    }
    // As in JSON.parse, the last of a repeated key wins.
    let prop = node.props.findLast((p) => p.key === key)
    if (!prop) {
      let rest = path.slice(depth + 1).reduceRight<unknown>((v, k) => ({ [k]: v }), value)
      let indent = '  '.repeat(depth + 1)
      let line = `${indent}${JSON.stringify(key)}: ${JSON.stringify(rest, null, 2).replaceAll('\n', `\n${indent}`)}`
      let at = node.start + 1
      let after = node.props.length ? ',' : `\n${'  '.repeat(depth)}`
      return text.slice(0, at) + `\n${line}${after}` + text.slice(at)
    }
    node = prop.value
    depth++
  }
  return text.slice(0, node.start) + JSON.stringify(value) + text.slice(node.end)
}
