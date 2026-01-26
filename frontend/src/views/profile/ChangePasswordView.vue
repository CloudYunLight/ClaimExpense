<template>
  <section class="panel">
    <h2>修改密码</h2>
    <p>首次登录需强制修改密码，此处也可随时更新。</p>
    <form class="password-form" @submit.prevent="handleSubmit">
      <label>
        旧密码
        <input v-model="form.oldPassword" type="password" required />
      </label>
      <label>
        新密码
        <input v-model="form.newPassword" type="password" required />
      </label>
      <label>
        确认新密码
        <input v-model="confirm" type="password" required />
      </label>
      <button type="submit" :disabled="saving">
        {{ saving ? '保存中...' : '保存修改' }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const toast = useToast()

const form = reactive({
  oldPassword: '',
  newPassword: ''
})

const confirm = ref('')
const saving = ref(false)

const handleSubmit = async () => {
  if (form.newPassword !== confirm.value) {
    toast.error('两次输入的新密码不一致')
    return
  }
  saving.value = true
  try {
    await authStore.changePassword({ ...form })
    toast.success('密码修改成功')
    form.oldPassword = ''
    form.newPassword = ''
    confirm.value = ''
  } catch (error) {
    toast.error('修改失败，请重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.panel {
  background: var(--surface);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
  max-width: 480px;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.password-form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
}

.password-form input {
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0.65rem;
}

button {
  border-radius: 12px;
  border: none;
  padding: 0.75rem;
  background: linear-gradient(120deg, var(--brand-primary), var(--brand-secondary));
  color: white;
}
</style>
