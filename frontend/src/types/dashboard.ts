export interface DashboardSummary {
  totalListCount: number
  totalAmount: number
  repaidAmount: number
  unrepaidAmount: number
  unrepaidListCount: number
  submittedListCount: number
  repaidListCount: number
}

export interface StatusDistributionItem {
  status: number
  statusCount: number
  statusAmount: number
  percentage: number
}

export interface DashboardFilter {
  startDate?: string
  endDate?: string
}
