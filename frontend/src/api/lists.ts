import http, { unwrap } from './http'
import type {
  CreateListPayload,
  ListSearchParams,
  ReimbursementListDetail,
  ReimbursementListItem,
  UpdateListStatusPayload
} from '@/types/list'
import type { PaginatedResult } from '@/types/http'

interface ListCollection extends PaginatedResult<ReimbursementListItem> {
  list: ReimbursementListItem[]
  pageNum: number
  pageSize: number
}

export const fetchLists = (params: ListSearchParams) =>
  unwrap<ListCollection>(http.get('/api/v1/lists/SearchLists', { params }))

export const createList = (payload: CreateListPayload) =>
  unwrap<{ listId: number }>(http.post('/api/v1/lists/CreateLists', payload))

export const getListDetail = (listId: number | string) =>
  unwrap<ReimbursementListDetail>(http.get(`/api/v1/lists/${listId}`))

export const updateListStatus = (listId: number, payload: UpdateListStatusPayload) =>
  unwrap<number>(http.post(`/api/v1/lists/${listId}/status`, payload))

export const deleteList = (listId: number) =>
  unwrap<null>(http.post(`/api/v1/lists/ListsDelete/${listId}`))
