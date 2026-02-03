import http, { unwrap } from './http'
// 导入用户相关的类型定义
import type { AdminUserItem, CreateUserPayload, UpdateUserStatusPayload } from '@/types/user'
// 导入分页结果类型定义
import type { PaginatedResult } from '@/types/http'

// 定义用户集合接口，扩展分页结果接口
  interface UserCollection extends PaginatedResult<AdminUserItem> {

    records: AdminUserItem[]
    pageNum?: number
    pageSize?: number
  }

// 获取用户列表函数，接受可选参数
export const fetchUsers = (params?: Record<string, unknown>) =>
  unwrap<UserCollection>(http.get('/api/v1/admin/users', { params }))

// 创建用户函数，接收创建用户的有效载荷
export const createUser = (payload: CreateUserPayload) =>
  unwrap<{ userId: number; initialPassword: string }>(http.post('/api/v1/admin/addUsers', payload))

// 重置用户密码函数，接收用户ID
export const resetPassword = (userId: number) =>
  unwrap<{ newPassword: string }>(http.post(`/api/v1/admin/users/${userId}/resetPassword`, {}))

// 更新用户状态函数，接收用户ID和更新状态的有效载荷
export const updateUserStatus = (userId: number, payload: UpdateUserStatusPayload) =>
  unwrap<string>(http.post(`/api/v1/admin/users/${userId}/status`, payload))