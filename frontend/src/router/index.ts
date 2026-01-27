// router/index.ts
// Vue Router 配置文件：定义路由实例、全局前置守卫（权限控制、页面标题等）

import { createRouter, createWebHistory } from 'vue-router'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import routes from './routes' // 导入路由配置
import { useAuthStore } from '@/stores/auth' // 用户认证状态管理
import { pinia } from '@/stores' // 全局 Pinia 实例（用于在非组件中使用 store）
import { useToast } from '@/composables/useToast' // 通知提示工具

// 扩展 vue-router 的 RouteMeta 类型，支持自定义元信息
declare module 'vue-router' {
  interface RouteMeta {
    title?: string // 页面标题（用于设置 document.title）
    requiresAuth?: boolean // 是否需要登录才能访问
    guestOnly?: boolean // 是否仅限未登录用户访问（如登录页）
    roles?: Array<'admin' | 'user'> // 允许访问的角色列表
  }
}

// 创建 Vue Router 实例；包含路由模式、路由表、滚动行为等
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // 使用 HTML5 History 模式，支持部署子路径
  routes, // 路由配置（配置了guard里面的name 映射）
  scrollBehavior: () => ({ top: 0 }) // 每次导航后滚动到页面顶部
})

/**
 * 全局路由守卫（前置守卫）
 * 负责处理：
 * - 用户状态初始化（恢复登录态）
 * - 路由权限校验（登录、角色、游客限制）
 * - 页面标题动态设置
 */
const guard = async (
  to: RouteLocationNormalized,     // 即将进入的目标路由
  from: RouteLocationNormalized,   // 当前离开的路由
  next: NavigationGuardNext        // 继续导航的函数
) => {
  const authStore = useAuthStore(pinia) // 获取认证状态仓库（使用全局 pinia 实例）
  const toast = useToast() // 获取 toast 提示方法

  // 如果用户状态尚未初始化（首次加载或刷新页面）
  if (!authStore.bootstrapped) {
    // 尝试从 localStorage / cookie 恢复登录状态（如 token）
    authStore.restore()

    // 如果已认证但用户信息缺失（例如只有 token 没有 profile），则拉取用户资料
    if (authStore.isAuthenticated && !authStore.user) {
      try {
        await authStore.fetchProfile() // 请求用户详情接口
      } catch (error) {
        // 若获取失败（如 token 过期），清除无效状态
        authStore.clear()
      }
    }
  }

  // 【权限校验 1】：需要认证的页面，但用户未登录 → 重定向到登录页，并携带原路径作为 redirect 参数
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // 【权限校验 2】：仅限游客访问的页面（如登录、注册），但用户已登录 → 跳转到首页
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  // 【权限校验 3】：基于角色的访问控制（RBAC）
  if (to.meta.roles && authStore.user) {
    const allowed = to.meta.roles.includes(authStore.user.role)
    if (!allowed) {
      toast.error('无权限访问该页面') // 提示用户无权限

      // 如果是从其他页面跳转而来，取消本次导航（保持在原页面）
      // 否则（如直接输入 URL），跳转到默认页面（如 dashboard）
      if (from.name) {
        next(false)
      } else {
        next({ name: 'dashboard' })
      }
      return // 阻止继续执行后续逻辑
    }
  }

  // 【页面标题设置】根据路由 meta 中的 title 动态更新 document.title
  if (to.meta.title) {
    document.title = ` $ {to.meta.title} ·  $ {import.meta.env.VITE_APP_NAME}`
  } else {
    document.title = import.meta.env.VITE_APP_NAME // 默认应用名称
  }

  // 放行，允许导航
  return next()
}

// 注册全局前置守卫
router.beforeEach(guard)

// 导出 router 实例供 main.ts 使用
export default router