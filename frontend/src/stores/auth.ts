// 使用 Pinia 定义状态管理 store

import { defineStore } from 'pinia'

// 引入与认证相关的 TypeScript 类型定义
import type {
  ChangePasswordPayload, // 修改密码请求参数
  LoginPayload,          // 登录请求参数
  RawUserInfo,           // 后端返回的原始用户数据
  UserInfo,              // 应用内部使用的标准化用户信息
  UserRole               // 用户角色类型（'admin' | 'user'）
} from '@/types/auth'

// 引入封装好的 API 调用函数（解耦业务逻辑与网络层）
import * as authApi from '@/api/auth'

// 本地存储的键名，用于持久化认证信息
const AUTH_CACHE_KEY = 'expense-claim-auth'

/**
 * 将后端数字角色（如 1=管理员, 0=普通用户）映射为前端语义化字符串
 */
const mapRole = (role?: number): UserRole => (role === 1 ? 'admin' : 'user')

/**
 * 标准化用户数据：将后端返回的 RawUserInfo 转换为前端统一使用的 UserInfo
 * 目的：隔离后端结构变化，保证应用内部数据结构稳定
 */
const normalizeUser = (payload: RawUserInfo): UserInfo => ({
  userId: payload.userId,
  username: payload.username,
  realName: payload.realName,
  role: mapRole(payload.role), // 角色转换
  status: payload.status
})

// 定义 store 的状态接口（TypeScript 类型安全）
interface AuthState {
  token: string           // JWT 或会话令牌
  user: UserInfo | null   // 当前登录用户信息（未登录为 null）
  bootstrapped: boolean   // 是否已完成初始化（如从 localStorage 恢复状态）
}

// 创建名为 'auth' 的 Pinia store
export const useAuthStore = defineStore('auth', {
  // 👇 状态（响应式数据）
  state: (): AuthState => ({  // 箭头函数写法：state: () => ({...}) 确保每个组件实例获得独立的 state 副本
    token: '',
    user: null,
    bootstrapped: false
  }),

  // 👇 计算属性（基于 state 的派生状态）
  getters: {
    // 判断用户是否已认证（有有效 token）
    isAuthenticated: (state) => Boolean(state.token),

    // 判断当前用户是否为管理员
    isAdmin: (state) => state.user?.role === 'admin'
  },

  // 👇 业务逻辑方法（可包含异步操作）
  actions: {
    /**
     * 用户登录
     */
    async login(payload: LoginPayload) {
      // 调用 API 登录，获取 token 和用户信息
      const data = await authApi.login(payload)
      
      // 更新状态
      this.token = data.token
      this.user = normalizeUser(data.userInfo)
      
      // 持久化到 localStorage
      this.persist()
    },

    /**
     * 获取当前用户资料（用于页面刷新后恢复用户信息）
     */
    async fetchProfile() {
      const profile = await authApi.fetchProfile()
      this.user = normalizeUser(profile)
      this.persist() // 也持久化，以防 token 有效但本地缓存过期
    },

    /**
     * 修改密码
     */
    async changePassword(payload: ChangePasswordPayload) {
      await authApi.changePassword(payload)
      // 注意：修改密码成功后通常不需要更新 token 或用户信息
    },

    /**
     * 正常登出：先调用后端登出接口，再清除本地状态
     */
    async logout() {
      if (this.token) {
        try {
          await authApi.logout()
        } catch {
          /* 忽略登出失败（如网络错误），仍清除本地状态 */
        }
      }
      this.clear()
    },

    /**
     * 强制登出（如 token 过期、权限异常）：不调用后端，直接清除本地状态
     */
    forcedLogout() {
      this.clear()
    },

    /**
     * 将当前认证状态持久化到 localStorage
     */
    persist() {
      const snapshot = JSON.stringify({ token: this.token, user: this.user })
      localStorage.setItem(AUTH_CACHE_KEY, snapshot)
    },

    /**
     * 从 localStorage 恢复认证状态（通常在应用启动时调用）
     */
    restore() {
      try {
        const cache = localStorage.getItem(AUTH_CACHE_KEY)
        if (cache) {
          const parsed = JSON.parse(cache)
          this.token = parsed.token
          this.user = parsed.user
        }
      } catch {
        // 解析失败（如 localStorage 被篡改），则清空
        this.clear()
      }
      // 标记初始化完成，避免重复 restore
      this.bootstrapped = true
    },

    /**
     * 清除所有认证状态（内存 + 本地存储）
     */
    clear() {
      this.token = ''
      this.user = null
      localStorage.removeItem(AUTH_CACHE_KEY)
    }
  }
})