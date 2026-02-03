// Toast（消息提示）通知系统

// 引入 Vue 3 的 ref，用于创建响应式数据
import { ref } from 'vue'

// 定义 Toast 消息类型：成功、错误、信息（可扩展 warning 等）
export type ToastType = 'success' | 'error' | 'info'

// 定义单条 Toast 消息的数据结构
export interface ToastItem {
  id: number          // 唯一标识，用于精准关闭某条消息
  message: string     // 提示文本
  type: ToastType     // 消息类型，决定样式（颜色、图标等）
  duration: number    // 自动消失时间（毫秒）
}

// 全局消息队列：响应式数组，供 UI 组件监听并渲染
const queue = ref<ToastItem[]>([])

// 用于生成唯一 ID 的计数器（简单但有效）
let seed = 0

// 导出组合式函数 useToast —— 这是核心 API
export const useToast = () => {
  /**
   * 手动关闭某条 Toast（通过 ID）
   */
  const dismiss = (id: number) => {
    queue.value = queue.value.filter((item) => item.id !== id)
  }

  /**
   * 通用推送方法：添加一条新消息到队列，并启动自动关闭定时器
   */
  const push = (message: string, type: ToastType = 'info', duration = 3200) => {
    const id = ++seed // 生成唯一 ID
    queue.value.push({ id, message, type, duration })
    
    // 设置定时器，到期后自动移除该消息
    window.setTimeout(() => dismiss(id), duration)
  }

  // 快捷方法：按类型推送消息（语义化调用）
  const success = (message: string) => push(message, 'success')
  const error = (message: string) => push(message, 'error')
  const info = (message: string) => push(message, 'info')

  // 返回公共 API
  return {
    toasts: queue,   // 响应式消息列表，供模板 v-for 渲染
    push,            // 通用推送
    dismiss,         // 手动关闭
    success,         // 成功提示
    error,           // 错误提示
    info             // 信息提示
  }
}