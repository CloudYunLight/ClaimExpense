// env.d.ts —— 环境类型声明文件
/// <reference types="vite/client" />

// 声明自定义环境变量
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
