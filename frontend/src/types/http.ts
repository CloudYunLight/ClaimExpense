export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
  timestamp: number
}

export interface PaginatedResult<T> {
  total: number
  pages?: number
  current?: number
  size?: number
  pageNum?: number
  pageSize?: number
  list?: T[]
  records?: T[]
}
