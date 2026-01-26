// main.ts —— 应用入口执行文件；整个前端应用的启动起点。

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'

import '@/styles/base.css'
import '@/styles/theme.css'
import '@/styles/utilities.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
