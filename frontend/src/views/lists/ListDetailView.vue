<template>
  <div v-if="loading" class="loading">加载清单详情...</div>
  <div v-else-if="detail" class="detail-page">
    <section class="panel hero">
      <div class="hero-info">
        <p class="eyebrow">报销清单</p>
        <h2>{{ detail.listInfo.activityName }}</h2>
        <div class="meta-row">
          <span>清单编号 #{{ detail.listInfo.listId }}</span>
          <span>创建 {{ formatDateTime(detail.listInfo.createTime) }}</span>
          <span>最近更新 {{ formatDateTime(detail.listInfo.updateTime) }}</span>
        </div>
      </div>
      <div class="hero-actions">
        <StatusBadge :status="detail.listInfo.status" />
        <select class="status-dropdown status-dropdown--inline" v-model.number="statusDraft" @change="updateStatus">
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <button type="button" class="ghost" :disabled="refreshing" @click="loadDetail({ silent: true })">
          {{ refreshing ? '同步中...' : '刷新数据' }}
        </button>
      </div>
    </section>

    <section class="metrics-grid">
      <article class="metric-card">
        <span>清单总金额</span>
        <strong>{{ formatCurrency(detail.listInfo.totalAmount) }}</strong>
        <small>提交时预计金额</small>
      </article>
      <article class="metric-card">
        <span>已录入账单</span>
        <strong>{{ formatCurrency(totalBillsAmount) }}</strong>
        <small>{{ detail.bills.length }} 条账单</small>
      </article>
      <article class="metric-card">
        <span>平均单笔金额</span>
        <strong>{{ formatCurrency(averageBillAmount) }}</strong>
        <small>仅统计已录入账单</small>
      </article>
      <article class="metric-card">
        <span>待处理</span>
        <strong>{{ detail.listInfo.status === 2 ? '全部完成' : '仍在进行' }}</strong>
        <small>状态可在右侧切换</small>
      </article>
    </section>

    <section class="panel insights-panel">
      <header>
        <div>
          <h3>支付方式构成</h3>
          <p>覆盖 {{ detail.bills.length }} 条账单</p>
        </div>
        <span class="pill">{{ paymentBreakdown.length }} 种方式</span>
      </header>
      <div class="breakdown-grid">
        <article v-for="item in paymentBreakdown" :key="item.value">
          <div class="breakdown-head">
            <span class="label">{{ item.label }}</span>
            <strong>{{ formatCurrency(item.amount) }}</strong>
          </div>
          <div class="breakdown-meta">
            <span>{{ item.count }} 笔</span>
            <span>{{ item.percent }}%</span>
          </div>
          <div class="progress-bar">
            <span class="fill" :style="{ width: `${item.percent}%` }" />
          </div>
        </article>
      </div>
    </section>

    <section class="workspace-grid">
      <div class="panel bills-panel">
        <header class="panel-header">
          <div>
            <h3>账单明细</h3>
            <p>{{ detail.bills.length }} 条记录</p>
          </div>
          <div class="panel-actions">
            <button type="button" class="ghost" :disabled="refreshing" @click="loadDetail({ silent: true })">
              {{ refreshing ? '同步中...' : '刷新列表' }}
            </button>
            <button v-if="billForm.billId" type="button" class="ghost" @click="resetBillForm">取消编辑</button>
          </div>
        </header>
        <div v-if="detail.bills.length" class="bill-list">
          <table class="bill-table desktop-only">
            <thead>
              <tr>
                <th>支付方式</th>
                <th>金额</th>
                <th>备注</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bill in detail.bills" :key="bill.billId" :class="{ active: billForm.billId === bill.billId }">
                <td>{{ methodLabel(bill.paymentMethod) }}</td>
                <td>{{ formatCurrency(bill.amount) }}</td>
                <td>{{ bill.remark || '--' }}</td>
                <td>{{ formatDateTime(bill.createTime) }}</td>
                <td class="actions">
                  <button type="button" class="ghost" @click="editBill(bill)">编辑</button>
                  <button type="button" class="warn" @click="removeBill(bill.billId)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="bill-cards mobile-only">
            <article v-for="bill in detail.bills" :key="bill.billId" :class="{ active: billForm.billId === bill.billId }">
              <header>
                <div>
                  <h4>{{ methodLabel(bill.paymentMethod) }}</h4>
                  <small>{{ formatDateTime(bill.createTime) }}</small>
                </div>
                <span class="amount">{{ formatCurrency(bill.amount) }}</span>
              </header>
              <p class="remark">{{ bill.remark || '无备注' }}</p>
              <div class="card-actions">
                <button type="button" class="ghost" @click="editBill(bill)">编辑</button>
                <button type="button" class="warn" @click="removeBill(bill.billId)">删除</button>
              </div>
            </article>
          </div>
        </div>
        <div v-else class="table-empty">
          <EmptyState>暂无账单，请先录入一笔</EmptyState>
        </div>
      </div>

      <aside class="panel form-panel">
        <header>
          <div>
            <p class="eyebrow">{{ billForm.billId ? '编辑账单' : '新增账单' }}</p>
            <h3>{{ detail.listInfo.activityName }}</h3>
          </div>
          <button v-if="billForm.billId" type="button" class="ghost" @click="resetBillForm">清除选择</button>
        </header>
        <form class="bill-form" @submit.prevent="submitBill">
          <label>
            支付方式
            <select v-model.number="billForm.paymentMethod">
              <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
                {{ method.label }}
              </option>
            </select>
          </label>
          <label>
            金额（元）
            <input v-model.number="billForm.amount" type="number" min="0.01" step="0.01" required />
          </label>
          <label>
            备注
            <textarea v-model.trim="billForm.remark" rows="3" placeholder="可输入发票号等信息" />
          </label>
          <div class="form-actions">
            <button type="submit">{{ billForm.billId ? '保存修改' : '添加账单' }}</button>
            <button v-if="billForm.billId" type="button" class="ghost" @click="resetBillForm">重置</button>
          </div>
        </form>
      </aside>
    </section>
  </div>
  <EmptyState v-else>未找到对应的清单</EmptyState>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as listApi from '@/api/lists'
import * as billApi from '@/api/bills'
import { STATUS_OPTIONS as statusOptions, PAYMENT_METHODS as paymentMethods } from '@/utils/constants'
import { formatCurrency, formatDateTime } from '@/utils/format'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { BillItem, ReimbursementListDetail, ReimbursementStatus } from '@/types/list'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const toast = useToast()

const loading = ref(true)
const refreshing = ref(false)
const detail = ref<ReimbursementListDetail | null>(null)
const statusDraft = ref<ReimbursementStatus>(0)

const defaultPaymentMethod = paymentMethods[0]?.value ?? 0

const billForm = reactive({
  billId: null as number | null,
  paymentMethod: defaultPaymentMethod,
  amount: 0,
  remark: ''
})

const parseListId = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const listId = ref<number | null>(parseListId(route.params.listId))

const totalBillsAmount = computed(() =>
  detail.value?.bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0) ?? 0
)

const billCount = computed(() => detail.value?.bills.length ?? 0)

const averageBillAmount = computed(() => {
  if (!billCount.value) return 0
  return totalBillsAmount.value / billCount.value
})

const paymentBreakdown = computed(() => {
  const buckets = paymentMethods.map((method) => ({
    ...method,
    count: 0,
    amount: 0,
    percent: 0
  }))
  const map = new Map<number, (typeof buckets)[number]>()
  buckets.forEach((bucket) => map.set(bucket.value, bucket))
  detail.value?.bills.forEach((bill) => {
    const bucket = map.get(bill.paymentMethod)
    if (bucket) {
      bucket.count += 1
      bucket.amount += Number(bill.amount || 0)
    }
  })
  const total = buckets.reduce((sum, bucket) => sum + bucket.amount, 0)
  buckets.forEach((bucket) => {
    bucket.percent = total ? Math.round((bucket.amount / total) * 100) : 0
  })
  return buckets
})

const loadDetail = async ({ silent = false } = {}) => {
  const targetId = listId.value

  if (silent) {
    refreshing.value = true
  } else {
    loading.value = true
  }

  if (targetId === null) {
    detail.value = null
    toast.error('未找到对应的清单')
    if (silent) {
      refreshing.value = false
    } else {
      loading.value = false
    }
    return
  }

  try {
    const data = await listApi.getListDetail(targetId)
    if (!data?.listInfo) {
      throw new Error('清单信息不存在或已被删除')
    }
    const normalized: ReimbursementListDetail = {
      listInfo: data.listInfo,
      bills: Array.isArray(data.bills) ? data.bills : []
    }
    detail.value = normalized
    statusDraft.value = normalized.listInfo.status
  } catch (error) {
    if (!silent) {
      detail.value = null
    }
    const message = error instanceof Error ? error.message : '无法获取清单详情'
    toast.error(message)
  } finally {
    if (silent) {
      refreshing.value = false
    } else {
      loading.value = false
    }
  }
}

const updateStatus = async () => {
  if (!detail.value) return
  if (statusDraft.value === detail.value.listInfo.status) return
  try {
    await listApi.updateListStatus(detail.value.listInfo.listId, { status: statusDraft.value })
    toast.success('状态已更新')
    await loadDetail({ silent: true })
  } catch (error) {
    toast.error('状态更新失败')
    statusDraft.value = detail.value.listInfo.status
  }
}

const submitBill = async () => {
  if (!detail.value) return
  try {
    if (billForm.billId) {
      await billApi.updateBill(billForm.billId, {
        paymentMethod: billForm.paymentMethod,
        amount: billForm.amount,
        remark: billForm.remark
      })
      toast.success('账单已更新')
    } else {
      await billApi.createBill({
        listId: detail.value.listInfo.listId,
        paymentMethod: billForm.paymentMethod,
        amount: billForm.amount,
        remark: billForm.remark
      })
      toast.success('账单已添加')
    }
    resetBillForm()
    await loadDetail({ silent: true })
  } catch (error) {
    toast.error('账单保存失败')
  }
}

const editBill = (bill: BillItem) => {
  billForm.billId = bill.billId
  billForm.paymentMethod = bill.paymentMethod
  billForm.amount = Number(bill.amount)
  billForm.remark = bill.remark ?? ''
}

const resetBillForm = () => {
  billForm.billId = null
  billForm.paymentMethod = defaultPaymentMethod
  billForm.amount = 0
  billForm.remark = ''
}

const removeBill = async (billId: number) => {
  if (!window.confirm('确定删除该账单吗？')) return
  try {
    await billApi.deleteBill(billId)
    toast.info('账单已删除')
    await loadDetail({ silent: true })
  } catch (error) {
    toast.error('账单删除失败')
  }
}

const methodLabel = (value: number) => paymentMethods.find((item) => item.value === value)?.label ?? '未知'

watch(
  () => route.params.listId,
  (next) => {
    listId.value = parseListId(next)
    loadDetail()
  }
)

onMounted(loadDetail)
</script>

<style scoped>
.loading {
  padding: 2rem;
  text-align: center;
}

.detail-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel {
  background: var(--surface);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.eyebrow {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  margin: 0 0 0.25rem;
}

.hero-info h2 {
  margin: 0;
  font-size: 1.5rem;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.hero-actions .ghost {
  border: none;
  border-radius: 999px;
  padding: 0.45rem 1rem;
  background: rgba(15, 23, 42, 0.06);
  cursor: pointer;
}

.hero-actions .ghost:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: rgba(15, 23, 42, 0.03);
  border-radius: 18px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metric-card span {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.metric-card strong {
  font-size: 1.4rem;
}

.metric-card small {
  color: var(--text-muted);
}

.insights-panel header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.pill {
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  font-size: 0.8rem;
}

.breakdown-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.breakdown-grid article {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.breakdown-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.breakdown-head strong {
  font-size: 1.1rem;
}

.breakdown-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.progress-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.progress-bar .fill {
  display: block;
  height: 100%;
  background: linear-gradient(120deg, #38bdf8, #6366f1);
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.bill-list {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  overflow: hidden;
}

.bill-table {
  width: 100%;
  border-collapse: collapse;
}

.bill-table th,
.bill-table td {
  padding: 0.8rem;
  text-align: left;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.bill-table tr.active {
  background: rgba(37, 99, 235, 0.08);
}

.actions {
  display: flex;
  gap: 0.35rem;
}

.actions button {
  border: none;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
}

.actions .ghost,
.card-actions .ghost,
.form-actions .ghost {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.actions .warn,
.card-actions .warn {
  background: rgba(220, 38, 38, 0.15);
  color: #991b1b;
}

.table-empty {
  padding: 2rem 0;
  text-align: center;
}

.bill-cards {
  display: none;
  gap: 1rem;
  padding: 1rem;
}

.bill-cards article {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 1rem;
}

.bill-cards article.active {
  border-color: rgba(37, 99, 235, 0.5);
}

.bill-cards header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.bill-cards .amount {
  font-weight: 700;
}

.bill-cards .remark {
  margin: 0.5rem 0;
  color: var(--text-muted);
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.card-actions button {
  border: none;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
}

.form-panel header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.bill-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bill-form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
}

.bill-form select,
.bill-form input,
.bill-form textarea {
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.6rem 0.75rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.form-actions button {
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
}

.form-actions button:first-child {
  background: linear-gradient(120deg, #38bdf8, #6366f1);
  color: white;
}

.desktop-only {
  display: table;
}

.mobile-only {
  display: none;
}

@media (max-width: 1100px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: grid;
  }

  .bill-list {
    border: none;
    padding: 0;
  }
}
</style>
