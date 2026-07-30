/// <reference types="vite/client" />

declare module '*.css'

interface ImportMetaEnv {
  readonly VITE_LINUX_ASSET_MANIFEST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
