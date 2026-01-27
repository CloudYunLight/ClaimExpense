// 引入 Vue Router 的类型定义，用于对路由对象进行类型校验（TypeScript）
import type { RouteRecordRaw } from 'vue-router'

// 定义路由配置数组，每个元素是一个 RouteRecordRaw 类型的对象
const routes: RouteRecordRaw[] = [
  // ───────────────────────────────
  // 【公开路由】登录页面
  // ───────────────────────────────
  {
    path: '/login',               // 访问路径
    name: 'login',                // 路由名称（可用于 router-link 或编程式导航）
    component: () => import('@/views/auth/LoginView.vue'), // 懒加载组件（按需加载，提升首屏性能）
    meta: {
      title: '登录',              // 页面标题（通常在路由守卫中用于动态设置 document.title）
      guestOnly: true             // 自定义元信息：仅未登录用户可访问（配合路由守卫实现）
    }
  },

  // ───────────────────────────────
  // 【受保护的主布局路由】所有需要登录后才能访问的页面都嵌套在此
  // 使用 AppLayout 作为父级布局组件（包含侧边栏、顶部栏等通用结构）
  // ───────────────────────────────
  {
    path: '/',                    // 根路径
    component: () => import('@/layouts/AppLayout.vue'), // 布局组件（不直接渲染内容，而是通过 <router-view> 渲染子路由）
    meta: {
      requiresAuth: true          // 自定义元信息：表示该路由及其子路由需要身份认证
    },
    children: [                   // 子路由（嵌套路由），将渲染在 AppLayout.vue 中的 <router-view> 位置
      // 默认重定向：当访问 / 时，自动跳转到 dashboard
      {
        path: '',
        redirect: { name: 'dashboard' }
      },

      // ── 数据大盘 ──
      {
        path: 'dashboard',        // 实际路径为 /dashboard
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: {
          title: '数据大盘'
        }
      },

      // ── 我的清单列表页 ──
      {
        path: 'lists',
        name: 'lists',
        component: () => import('@/views/lists/ListOverviewView.vue'),
        meta: {
          title: '我的清单'
        }
      },

      // ── 清单详情页（带参数）──
      {
        path: 'lists/:listId',    // 动态路由参数，例如 /lists/123
        name: 'list-detail',
        component: () => import('@/views/lists/ListDetailView.vue'),
        meta: {
          title: '清单详情'
        }
        // 注意：实际页面中可通过 route.params.listId 获取参数
      },

      // ── 管理员专属：用户管理 ──
      {
        path: 'admin/users',
        name: 'admin-users',
        component: () => import('@/views/admin/AdminUsersView.vue'),
        meta: {
          title: '用户管理',
          roles: ['admin']        // 自定义元信息：仅允许角色为 'admin' 的用户访问（需在路由守卫中校验）
        }
      },

      // ── 个人设置：修改密码 ──
      {
        path: 'profile/password',
        name: 'change-password',
        component: () => import('@/views/profile/ChangePasswordView.vue'),
        meta: {
          title: '修改密码'
        }
      }
    ]
  },

  // ───────────────────────────────
  // 【兜底路由】匹配所有未定义的路径（404 页面）
  // 使用 pathMatch 捕获任意路径（Vue Router v4+ 语法）
  // ───────────────────────────────
  {
    path: '/:pathMatch(.*)*',     // 通配符路由，匹配任何未被上述规则捕获的路径
    name: 'not-found',
    component: () => import('@/views/errors/NotFoundView.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

// 导出路由配置，供 main.ts 或 router/index.ts 中创建 router 实例使用
export default routes