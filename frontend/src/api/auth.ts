import http, { unwrap } from './http'
import type { ChangePasswordPayload, LoginPayload, LoginSuccess, RawUserInfo } from '@/types/auth'

export const login = (payload: LoginPayload) =>
  unwrap<LoginSuccess>(http.post('/api/v1/auth/login', payload))

export const fetchProfile = () => unwrap<RawUserInfo>(http.get('/api/v1/auth/me'))

export const logout = () => unwrap<null>(http.post('/api/v1/auth/logout', {}))

export const changePassword = (payload: ChangePasswordPayload) =>
  unwrap<null>(http.post('/api/v1/auth/ChangePassword', payload))
