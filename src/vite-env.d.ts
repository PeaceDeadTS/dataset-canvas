/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_MEDIA_BASE?: string
  readonly VITE_CDN_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

