export interface BillPayload {
  listId: number
  paymentMethod: number
  amount: number
  remark?: string
}

export interface UpdateBillPayload {
  paymentMethod: number
  amount: number
  remark?: string
}
