import http, { unwrap } from './http'
import type { AdminUserItem, CreateUserPayload, UpdateUserStatusPayload } from '@/types/user'
import type { PaginatedResult } from '@/types/http'

interface UserCollection extends PaginatedResult<AdminUserItem> {
  records: AdminUserItem[]
  pageNum?: number
  pageSize?: number
}

export const fetchUsers = (params?: Record<string, unknown>) =>
  unwrap<UserCollection>(http.get('/api/v1/admin/users', { params }))

export const createUser = (payload: CreateUserPayload) =>
  unwrap<{ userId: number; initialPassword: string }>(http.post('/api/v1/admin/addUsers', payload))

export const resetPassword = (userId: number) =>
  unwrap<{ newPassword: string }>(http.post(`/api/v1/admin/users/${userId}/resetPassword`, {}))

export const updateUserStatus = (userId: number, payload: UpdateUserStatusPayload) =>
  unwrap<string>(http.post(`/api/v1/admin/users/${userId}/status`, payload))
