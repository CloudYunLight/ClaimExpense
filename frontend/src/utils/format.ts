import { format } from 'date-fns'

export const formatCurrency = (value?: number | string, currency = 'CNY') => {
  if (value === undefined || value === null) return '--'
  const numeric = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(numeric)
}

export const formatDateTime = (value?: string) => {
  if (!value) return '--'
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm')
  } catch (error) {
    return value
  }
}
