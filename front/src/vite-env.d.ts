/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // 可根据需要添加更多环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}