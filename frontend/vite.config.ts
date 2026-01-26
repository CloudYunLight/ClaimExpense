// vite.config.ts（Vite 构建配置）
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'  // 导入 Vue 插件，使 Vite 能够处理 Vue 单文件组件
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
// 这是 Node.js 内置模块，用于将 import.meta.url
//    （ESM 环境下的当前模块 URL）转换为传统文件路径（字符串），以便在 alias 中使用。
export default defineConfig({
  plugins: [vue()], // 定义 Vite 构建过程中使用的插件数组
  resolve: {
    // 定义路径别名，方便在项目中更简洁地导入模块
    alias: {
       // 将 @ 符号映射到项目根目录下的 src 目录
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
