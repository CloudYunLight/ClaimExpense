export type ReimbursementStatus = 0 | 1 | 2

export interface ReimbursementListItem {
  listId: number
  activityName: string
  creatorId?: number
  totalAmount: number
  status: ReimbursementStatus
  createTime: string
  updateTime: string
}

export interface ReimbursementListDetail {
  listInfo: ReimbursementListItem
  bills: BillItem[]
}

export interface ListSearchParams {
  pageNum?: number
  pageSize?: number
  activityName?: string
  status?: ReimbursementStatus
  startTime?: string
  endTime?: string
}

export interface CreateListPayload {
  activityName: string
}

export interface UpdateListStatusPayload {
  status: ReimbursementStatus
}

export interface BillItem {
  billId: number
  listId: number
  paymentMethod: number
  amount: number
  remark?: string
  payerId?: number
  payerName?: string
  createTime: string
  updateTime?: string
}
