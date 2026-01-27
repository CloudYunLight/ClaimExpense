import type { ReimbursementStatus } from '@/types/list'

export interface StatusMeta {
  value: ReimbursementStatus
  label: string
  description: string
  color: string
}

// 报销状态元信息
export const STATUS_OPTIONS: StatusMeta[] = [
  { value: 0, label: '未报销', description: '待整理票据', color: '#f97316' },
  { value: 1, label: '已上交文件', description: '等待财务审批', color: '#facc15' },
  { value: 2, label: '已回款', description: '流程已完成', color: '#34d399' }
]

export const PAYMENT_METHODS = [
  { value: 0, label: '微信' },
  { value: 1, label: '支付宝' },
  { value: 2, label: '现金' },
  { value: 3, label: '需要转交' }
]

// 导航栏项目定义
interface NavigationItem {
  label: string
  routeName: string
  icon: string
  roles: Array<'admin' | 'user'>
}

export const NAV_ITEMS: NavigationItem[] = [
  { label: '数据大盘', routeName: 'dashboard', icon: 'dashboard', roles: ['admin', 'user'] },
  { label: '我的清单', routeName: 'lists', icon: 'layers', roles: ['user', 'admin'] },
  { label: '修改密码', routeName: 'change-password', icon: 'lock', roles: ['admin', 'user'] },
  { label: '用户管理', routeName: 'admin-users', icon: 'users', roles: ['admin'] }
]

// 安全地根据 status 值查找对应的 StatusMeta 对象
export const getStatusMeta = (status: ReimbursementStatus): StatusMeta => {
  const match = STATUS_OPTIONS.find((item) => item.value === status)
  return match ?? STATUS_OPTIONS[0]!
}

// 页脚默认跳转链接，可通过环境变量 VITE_COPYRIGHT_URL 覆盖
export const COPYRIGHT_FALLBACK_URL = 'http://github.com/CloudYunLight/ClaimExpense'
