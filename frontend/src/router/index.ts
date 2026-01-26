import { createRouter, createWebHistory } from 'vue-router'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '@/stores/auth'
import { pinia } from '@/stores'
import { useToast } from '@/composables/useToast'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    guestOnly?: boolean
    roles?: Array<'admin' | 'user'>
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

const guard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore(pinia)
  const toast = useToast()

  if (!authStore.bootstrapped) {
    authStore.restore()
    if (authStore.isAuthenticated && !authStore.user) {
      try {
        await authStore.fetchProfile()
      } catch (error) {
        authStore.clear()
      }
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  if (to.meta.roles && authStore.user) {
    const allowed = to.meta.roles.includes(authStore.user.role)
    if (!allowed) {
      toast.error('无权限访问该页面')
      if (from.name) {
        next(false)
      } else {
        next({ name: 'dashboard' })
      }
      return
    }
  }

  if (to.meta.title) {
    document.title = `${to.meta.title} · ${import.meta.env.VITE_APP_NAME}`
  } else {
    document.title = import.meta.env.VITE_APP_NAME
  }

  return next()
}

router.beforeEach(guard)

export default router
