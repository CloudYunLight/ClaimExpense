import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: {
      title: '登录',
      guestOnly: true
    }
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        redirect: { name: 'dashboard' }
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: {
          title: '数据大盘'
        }
      },
      {
        path: 'lists',
        name: 'lists',
        component: () => import('@/views/lists/ListOverviewView.vue'),
        meta: {
          title: '我的清单'
        }
      },
      {
        path: 'lists/:listId',
        name: 'list-detail',
        component: () => import('@/views/lists/ListDetailView.vue'),
        meta: {
          title: '清单详情'
        }
      },
      {
        path: 'admin/users',
        name: 'admin-users',
        component: () => import('@/views/admin/AdminUsersView.vue'),
        meta: {
          title: '用户管理',
          roles: ['admin']
        }
      },
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
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/errors/NotFoundView.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

export default routes
