<template>
  <div class="auth-page">
    <section class="auth-hero">
      <p class="eyebrow">Expense Claim Studio</p>
      <h1>一站式报销跟踪与大盘洞察</h1>
      <p>
        根据 Document 中的业务规范，前端提供登录、报销清单、账单管理、用户中心与大盘组件，帮助每位用户掌握自己的费用进度。
      </p>
    </section>
    <section class="auth-card">
      <h2>登录账号</h2>
      <form @submit.prevent="handleSubmit">
        <label>
          用户名
          <input v-model.trim="form.username" type="text" placeholder="请输入用户名" required />
        </label>
        <label>
          密码
          <input v-model="form.password" type="password" placeholder="请输入密码" required />
        </label>
        <button type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const form = reactive({
  username: '',
  password: ''
})

const loading = ref(false)

const handleSubmit = async () => {
  if (!form.username || !form.password) return
  loading.value = true
  try {
    await authStore.login({ ...form })
    toast.success('登录成功')
    const redirect = (route.query.redirect as string) || 'dashboard'
    router.push(redirect)
  } catch (error) {
    toast.error('登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  align-items: stretch;
  padding: 4rem;
  gap: 2rem;
  background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.15), transparent 45%),
    radial-gradient(circle at bottom left, rgba(249, 115, 22, 0.12), transparent 40%);
}

.auth-hero {
  color: #0f172a;
  padding-right: 3rem;
}

.auth-card {
  background: var(--surface);
  border-radius: 32px;
  padding: 2.5rem;
  box-shadow: var(--shadow-card);
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
}

input {
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 0.85rem 1rem;
}

button {
  border: none;
  border-radius: 14px;
  padding: 0.85rem;
  background: linear-gradient(120deg, var(--brand-primary), var(--brand-secondary));
  color: white;
  font-size: 1rem;
  cursor: pointer;
}

@media (max-width: 640px) {
  .auth-page {
    padding: 2rem 1.5rem;
  }
}
</style>
