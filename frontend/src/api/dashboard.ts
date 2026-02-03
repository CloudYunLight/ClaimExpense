import http, { unwrap } from './http'
import type { DashboardFilter, DashboardSummary, StatusDistributionItem } from '@/types/dashboard'

export const getSummary = (params?: DashboardFilter) =>
  unwrap<DashboardSummary>(http.get('/api/v1/dashboard/summary', { params }))

export const getStatusDistribution = (params?: DashboardFilter) =>
  unwrap<StatusDistributionItem[]>(http.get('/api/v1/dashboard/status', { params }))
