import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
  duration: number
}

const queue = ref<ToastItem[]>([])
let seed = 0

export const useToast = () => {
  const dismiss = (id: number) => {
    queue.value = queue.value.filter((item) => item.id !== id)
  }

  const push = (message: string, type: ToastType = 'info', duration = 3200) => {
    const id = ++seed
    queue.value.push({ id, message, type, duration })
    window.setTimeout(() => dismiss(id), duration)
  }

  const success = (message: string) => push(message, 'success')
  const error = (message: string) => push(message, 'error')
  const info = (message: string) => push(message, 'info')

  return {
    toasts: queue,
    push,
    dismiss,
    success,
    error,
    info
  }
}
