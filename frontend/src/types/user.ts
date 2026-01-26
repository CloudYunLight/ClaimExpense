export interface AdminUserItem {
  userId: number
  username: string
  realName: string
  role: number
  status: number
  createTime: string
}

export interface CreateUserPayload {
  usernameAdd: string
  realNameAdd: string
}

export interface UpdateUserStatusPayload {
  status: number
}
