//  格式化工具函数模块，用于统一处理 货币金额 和 日期时间 的显示格式
import { format } from 'date-fns'

export const formatCurrency = (value?: number | string, currency = 'CNY') => {
  if (value === undefined || value === null) return '--'
  const numeric = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat('zh-CN', { // 浏览器原生API，中文格式
    style: 'currency',  // 启用货币模式
    currency,
    minimumFractionDigits: 2  // 最小小数位数
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
