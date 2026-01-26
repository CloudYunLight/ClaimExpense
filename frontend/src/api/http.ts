import axios from 'axios'
import type { AxiosRequestHeaders, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types/http'
import { useAuthStore } from '@/stores/auth'
import { pinia } from '@/stores'

// 自定义错误类：ApiError
export class ApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

// 创建 Axios 实例 + 配置基础 URL 和超时。所有请求自动拼接
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
})

// 请求拦截器：自动注入 JWT Token
http.interceptors.request.use((config) => {
  const authStore = useAuthStore(pinia) // 获取认证状态存储实例
  if (authStore.token) {
    const headers = (config.headers ?? {}) as AxiosRequestHeaders
    // 在请求头中添加 Authorization 字段，值为 Bearer token 格式
    headers.Authorization = `Bearer ${authStore.token}`
    config.headers = headers
  }
  return config
})

// 添加响应拦截器，处理响应或错误
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) { // 如果状态码是 401（未授权），执行登出操作
      const authStore = useAuthStore(pinia)
      authStore.forcedLogout()  // 执行强制登出操作
    }
    return Promise.reject(error)
  }
)


// 定义一个异步函数，用于解包 API 响应
export const unwrap = async <T>(
  promise: Promise<AxiosResponse<ApiResponse<T>>> // ApiResponse<T>，是自定义响应结构
): Promise<T> => {
  const response = await promise
  const payload = response.data
  if (payload.code !== 200) {
    throw new ApiError(payload.code, payload.msg || '请求失败')
  }
  return payload.data
}

// 默认导出 axios 实例
export default http
