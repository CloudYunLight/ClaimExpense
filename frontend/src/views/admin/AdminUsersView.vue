<template>
  <section class="panel">
    <header class="panel-header">
      <div>
        <h2>管理员 · 用户管理</h2>
        <p>严格遵循 Document 的管理员边界，只操作用户表</p>
      </div>
      <form class="filters" @submit.prevent="loadUsers">
        <input v-model.trim="filters.username" type="text" placeholder="用户名" />
        <input v-model.trim="filters.realName" type="text" placeholder="真实姓名" />
        <select v-model="filters.status">
          <option value="">全部</option>
          <option value="1">正常</option>
          <option value="0">锁定</option>
        </select>
        <button type="submit">查询</button>
      </form>
    </header>

    <div class="create-box">
      <form class="create-form" @submit.prevent="createUser">
        <input v-model.trim="form.usernameAdd" type="text" placeholder="用户名" required />
        <input v-model.trim="form.realNameAdd" type="text" placeholder="真实姓名" required />
        <button type="submit" :disabled="creating">{{ creating ? '创建中...' : '新增用户' }}</button>
      </form>
      <p v-if="initialPassword">新用户初始密码：<strong>{{ initialPassword }}</strong></p>
    </div>

    <div v-if="loading" class="loading">读取用户列表...</div>
    <template v-else>
      <table v-if="users.length" class="user-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>真实姓名</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.userId">
            <td>{{ user.username }}</td>
            <td>{{ user.realName }}</td>
            <td>
              <span :class="['pill', user.status === 1 ? 'ok' : 'lock']">
                {{ user.status === 1 ? '正常' : '锁定' }}
              </span>
            </td>
            <td>{{ formatDateTime(user.createTime) }}</td>
            <td class="actions">
              <button type="button" @click="resetPassword(user.userId)">重置密码</button>
              <button type="button" class="ghost" @click="toggleStatus(user)">
                {{ user.status === 1 ? '锁定' : '解锁' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-else>暂无用户记录</EmptyState>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import * as adminApi from '@/api/admin'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatDateTime } from '@/utils/format'
import type { AdminUserItem } from '@/types/user'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const filters = reactive({
  username: '',
  realName: '',
  status: ''
})

const users = ref<AdminUserItem[]>([])
const loading = ref(false)
const creating = ref(false)
const initialPassword = ref('')

const form = reactive({
  usernameAdd: '',
  realNameAdd: ''
})

const loadUsers = async () => {
  loading.value = true
  try {
    const data = await adminApi.fetchUsers({ ...filters })
    users.value = data.records ?? []
  } catch (error) {
    toast.error('用户列表获取失败')
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  creating.value = true
  try {
    const result = await adminApi.createUser({ ...form })
    initialPassword.value = result.initialPassword
    toast.success('用户已创建')
    form.usernameAdd = ''
    form.realNameAdd = ''
    loadUsers()
  } catch (error) {
    toast.error('创建用户失败')
  } finally {
    creating.value = false
  }
}

const resetPassword = async (userId: number) => {
  try {
    const data = await adminApi.resetPassword(userId)
    toast.info(`新密码：${data.newPassword}`)
  } catch (error) {
    toast.error('重置失败')
  }
}

const toggleStatus = async (user: AdminUserItem) => {
  try {
    await adminApi.updateUserStatus(user.userId, { status: user.status === 1 ? 0 : 1 })
    toast.success('状态已更新')
    loadUsers()
  } catch (error) {
    toast.error('状态更新失败')
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.panel {
  background: var(--surface);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filters {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.filters input,
.filters select {
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0.5rem 0.75rem;
}

.filters button {
  border-radius: 10px;
  border: none;
  padding: 0.5rem 1rem;
  background: rgba(37, 99, 235, 0.9);
  color: white;
}

.create-box {
  background: rgba(37, 99, 235, 0.08);
  padding: 1rem;
  border-radius: 18px;
}

.create-form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.create-form input {
  flex: 1;
  min-width: 160px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0.5rem;
}

.create-form button {
  border-radius: 12px;
  border: none;
  padding: 0.5rem 1rem;
  background: linear-gradient(120deg, #34d399, #22d3ee);
  color: #0f172a;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.pill {
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  font-weight: 600;
}

.pill.ok {
  background: rgba(74, 222, 128, 0.3);
}

.pill.lock {
  background: rgba(248, 113, 113, 0.3);
}

.actions button {
  border-radius: 999px;
  border: none;
  padding: 0.35rem 0.75rem;
  margin-right: 0.35rem;
  cursor: pointer;
}

.actions .ghost {
  background: rgba(15, 23, 42, 0.08);
}

.loading {
  padding: 1rem;
  text-align: center;
  color: var(--text-muted);
}
</style>
