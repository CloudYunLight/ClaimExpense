import axios from 'axios'
import type { AxiosRequestHeaders, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types/http'
import { useAuthStore } from '@/stores/auth'
import { pinia } from '@/stores'

export class ApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
})

http.interceptors.request.use((config) => {
  const authStore = useAuthStore(pinia)
  if (authStore.token) {
    const headers = (config.headers ?? {}) as AxiosRequestHeaders
    headers.Authorization = `Bearer ${authStore.token}`
    config.headers = headers
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      const authStore = useAuthStore(pinia)
      authStore.forcedLogout()
    }
    return Promise.reject(error)
  }
)

export const unwrap = async <T>(promise: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> => {
  const response = await promise
  const payload = response.data
  if (payload.code !== 200) {
    throw new ApiError(payload.code, payload.msg || '请求失败')
  }
  return payload.data
}

export default http
