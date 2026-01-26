import { defineStore } from 'pinia'
import type {
  ChangePasswordPayload,
  LoginPayload,
  RawUserInfo,
  UserInfo,
  UserRole
} from '@/types/auth'
import * as authApi from '@/api/auth'

const AUTH_CACHE_KEY = 'expense-claim-auth'

const mapRole = (role?: number): UserRole => (role === 1 ? 'admin' : 'user')

const normalizeUser = (payload: RawUserInfo): UserInfo => ({
  userId: payload.userId,
  username: payload.username,
  realName: payload.realName,
  role: mapRole(payload.role),
  status: payload.status
})

interface AuthState {
  token: string
  user: UserInfo | null
  bootstrapped: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: '',
    user: null,
    bootstrapped: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.role === 'admin'
  },
  actions: {
    async login(payload: LoginPayload) {
      const data = await authApi.login(payload)
      this.token = data.token
      this.user = normalizeUser(data.userInfo)
      this.persist()
    },
    async fetchProfile() {
      const profile = await authApi.fetchProfile()
      this.user = normalizeUser(profile)
      this.persist()
    },
    async changePassword(payload: ChangePasswordPayload) {
      await authApi.changePassword(payload)
    },
    async logout() {
      if (this.token) {
        try {
          await authApi.logout()
        } catch {
          /* 网络异常时忽略 */
        }
      }
      this.clear()
    },
    forcedLogout() {
      this.clear()
    },
    persist() {
      const snapshot = JSON.stringify({ token: this.token, user: this.user })
      localStorage.setItem(AUTH_CACHE_KEY, snapshot)
    },
    restore() {
      try {
        const cache = localStorage.getItem(AUTH_CACHE_KEY)
        if (cache) {
          const parsed = JSON.parse(cache)
          this.token = parsed.token
          this.user = parsed.user
        }
      } catch {
        this.clear()
      }
      this.bootstrapped = true
    },
    clear() {
      this.token = ''
      this.user = null
      localStorage.removeItem(AUTH_CACHE_KEY)
    }
  }
})
