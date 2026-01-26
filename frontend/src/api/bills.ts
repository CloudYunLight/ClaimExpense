import http, { unwrap } from './http'
import type { BillPayload, UpdateBillPayload } from '@/types/bill'

export const createBill = (payload: BillPayload) =>
  unwrap<{ billId: number }>(http.post('/api/v1/bills', payload))

export const updateBill = (billId: number, payload: UpdateBillPayload) =>
  unwrap<null>(http.post(`/api/v1/bills/${billId}`, payload))

export const deleteBill = (billId: number) => unwrap<null>(http.post(`/api/v1/bills/delete/${billId}`))
