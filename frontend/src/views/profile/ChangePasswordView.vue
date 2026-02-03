<template>
  <section class="password-page">
    <div class="card-grid">
      <section class="panel form-panel">
        <header>
          <h2>修改密码</h2>
          <p>完成以下安全校验后提交，系统将立即生效。</p>
        </header>
        <form class="password-form" @submit.prevent="handleSubmit">
          <div class="field-grid">
            <label>
              旧密码
              <input v-model.trim="form.oldPassword" type="password" autocomplete="current-password" required />
            </label>
            <label>
              新密码
              <input
                v-model.trim="form.newPassword"
                type="password"
                autocomplete="new-password"
                required
              />
            </label>
            <label>
              确认新密码
              <input v-model.trim="confirm" type="password" autocomplete="new-password" required />
              <small v-if="confirmError" class="field-hint">{{ confirmError }}</small>
            </label>
          </div>
          <div class="strength-bar">
            <div class="strength-track">
              <span class="strength-fill" :style="{ width: `${strength.percent}%`, background: strength.color }" />
            </div>
            <span class="strength-label">{{ strength.label }}</span>
          </div>
          <ul class="rule-list">
            <li v-for="rule in ruleStates" :key="rule.key" :class="{ passed: rule.passed }">
              <span class="dot" />
              {{ rule.label }}
            </li>
          </ul>
          <button type="submit" :disabled="saving || !canSubmit">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
        </form>
      </section>
      <aside class="panel tips-panel">
        <h3>安全提示</h3>
        <p>使用大小写字母、数字与符号的组合，会显著提升暴力破解成本。</p>
        <dl>
          <div>
            <dt>当前账号</dt>
            <dd>{{ currentUser?.username || '未知用户' }}</dd>
          </div>
          <div>
            <dt>姓名</dt>
            <dd>{{ currentUser?.realName || '--' }}</dd>
          </div>
        </dl>
        <div class="tips-callout">
          <p>推荐做法</p>
          <ul>
            <li>每 90 天轮换密码，勿与邮件或 ERP 共用。</li>
            <li>禁用浏览器记住密码，优先使用密码管理器。</li>
            <li>输入完成后确认无他人旁观再提交。</li>
          </ul>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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

const passwordRules = [
  { key: 'length', label: '至少 10 个字符', validator: (value: string) => value.length >= 10 },
  { key: 'upper', label: '包含大写字母', validator: (value: string) => /[A-Z]/.test(value) },
  { key: 'lower', label: '包含小写字母', validator: (value: string) => /[a-z]/.test(value) },
  { key: 'digit', label: '包含数字', validator: (value: string) => /\d/.test(value) },
  { key: 'symbol', label: '包含符号', validator: (value: string) => /[^A-Za-z0-9]/.test(value) }
]

const currentUser = computed(() => authStore.user)

const ruleStates = computed(() =>
  passwordRules.map((rule) => ({ ...rule, passed: rule.validator(form.newPassword) }))
)

const strength = computed(() => {
  const passed = ruleStates.value.filter((rule) => rule.passed).length
  const percent = Math.min(100, Math.max(0, Math.round((passed / passwordRules.length) * 100)))
  if (!form.newPassword) {
    return { label: '等待输入', percent: 0, color: 'rgba(148, 163, 184, 0.6)' }
  }
  if (percent < 40) return { label: '弱', percent, color: '#f97316' }
  if (percent < 80) return { label: '中', percent, color: '#facc15' }
  return { label: '强', percent, color: '#22c55e' }
})

const confirmError = computed(() => {
  if (!confirm.value) return ''
  if (confirm.value !== form.newPassword) return '两次输入不一致'
  return ''
})

const canSubmit = computed(() => {
  const allRulesPassed = ruleStates.value.every((rule) => rule.passed)
  const confirmMatched = !confirmError.value
  return Boolean(form.oldPassword && form.newPassword) && allRulesPassed && confirmMatched
})

const handleSubmit = async () => {
  if (!canSubmit.value) {
    toast.error(confirmError.value || '请先满足所有口令规则')
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
.password-page {
  display: flex;
  justify-content: center;
}

.card-grid {
  display: grid;
  grid-template-columns: minmax(320px, 520px) minmax(240px, 1fr);
  gap: 1.5rem;
  width: 100%;
}

.panel {
  background: var(--surface);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.25rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
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

.field-hint {
  color: #dc2626;
}

.strength-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.strength-track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.strength-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.strength-label {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.rule-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.rule-list li {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-muted);
}

.rule-list .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.8);
}

.rule-list li.passed {
  color: #16a34a;
}

.rule-list li.passed .dot {
  background: #16a34a;
}

.password-form button {
  border-radius: 12px;
  border: none;
  padding: 0.85rem;
  background: linear-gradient(120deg, var(--brand-primary), var(--brand-secondary));
  color: white;
  cursor: pointer;
}

.password-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tips-panel dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.tips-panel dt {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.tips-panel dd {
  margin: 0;
  font-weight: 600;
}

.tips-callout {
  border-radius: 18px;
  padding: 1rem;
  background: rgba(37, 99, 235, 0.08);
}

.tips-callout ul {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
