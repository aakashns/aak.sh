// Files the site embeds, imported as their paths (see public.ts).
declare module '*.png' {
  const path: string
  export default path
}
declare module '*.ico' {
  const path: string
  export default path
}
declare module '*.svg' {
  const path: string
  export default path
}
declare module '*.txt' {
  const path: string
  export default path
}
declare module '*/datastar.js' {
  const path: string
  export default path
}
// The installer, imported as text (see server.ts).
declare module '*.sh' {
  const text: string
  export default text
}
