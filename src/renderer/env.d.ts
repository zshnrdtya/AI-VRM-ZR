/// <reference types="vite/client" />

declare module '*.vrm' {
  const content: string
  export default content
}

declare module '*.vrm?url' {
  const content: string
  export default content
}
