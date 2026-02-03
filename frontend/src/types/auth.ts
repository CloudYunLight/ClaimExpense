export type UserRole = 'admin' | 'user'

export interface RawUserInfo {
  userId: number
  username: string
  realName: string
  role: number
  status: number
}

export interface UserInfo {
  userId: number
  username: string
  realName: string
  role: UserRole
  status: number
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginSuccess {
  token: string
  userInfo: RawUserInfo
}

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
}
