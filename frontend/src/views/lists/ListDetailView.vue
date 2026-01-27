<template>
  <div v-if="loading" class="loading">加载清单详情...</div>
  <div v-else-if="detail" class="detail-grid">
    <div v-if="refreshing" class="refresh-indicator">
      <span class="pulse-dot" /> 数据同步中...
    </div>
    <section class="info-card">
      <header>
        <h2>{{ detail.listInfo.activityName }}</h2>
        <StatusBadge :status="detail.listInfo.status" />
      </header>
      <dl>
        <div>
          <dt>总金额</dt>
          <dd>{{ formatCurrency(detail.listInfo.totalAmount) }}</dd>
        </div>
        <div>
          <dt>创建时间</dt>
          <dd>{{ formatDateTime(detail.listInfo.createTime) }}</dd>
        </div>
        <div>
          <dt>更新时间</dt>
          <dd>{{ formatDateTime(detail.listInfo.updateTime) }}</dd>
        </div>
      </dl>
      <label class="status-select">
        调整状态
        <select class="status-dropdown status-dropdown--inline" v-model.number="statusDraft" @change="updateStatus">
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </section>
    <section class="bills-card">
      <header class="panel-header">
        <h3>账单明细</h3>
        <p>{{ detail.bills.length }} 条记录</p>
      </header>
      <form class="bill-form" @submit.prevent="submitBill">
        <div class="grid-two">
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
        </div>
        <label>
          备注
          <textarea v-model.trim="billForm.remark" rows="2" placeholder="可输入发票号等信息" />
        </label>
        <div class="form-actions">
          <button type="submit">{{ billForm.billId ? '更新账单' : '添加账单' }}</button>
          <button v-if="billForm.billId" type="button" class="ghost" @click="resetBillForm">取消编辑</button>
        </div>
      </form>
      <table v-if="detail.bills.length" class="bill-table">
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
          <tr v-for="bill in detail.bills" :key="bill.billId">
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
      <EmptyState v-else>暂无账单，请先录入一笔</EmptyState>
    </section>
  </div>
  <EmptyState v-else>未找到对应的清单</EmptyState>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
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

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.info-card,
.bills-card {
  background: var(--surface);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

.info-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

dl div {
  background: rgba(15, 23, 42, 0.05);
  padding: 0.75rem;
  border-radius: 12px;
}

dl dt {
  font-size: 0.8rem;
  color: var(--text-muted);
}

dl dd {
  margin: 0;
  font-weight: 600;
}

.status-select {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 1.5rem;
}

.status-dropdown--inline {
  width: 100%;
}

.bill-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.bill-form select,
.bill-form input,
.bill-form textarea {
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.6rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
}

.form-actions button {
  border-radius: 12px;
  border: none;
  padding: 0.6rem 1.25rem;
  cursor: pointer;
}

.form-actions .ghost {
  background: rgba(15, 23, 42, 0.06);
}

.bill-table {
  width: 100%;
  border-collapse: collapse;
}

.bill-table th,
.bill-table td {
  text-align: left;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.1);
}

.actions button {
  border-radius: 999px;
  border: none;
  padding: 0.35rem 0.8rem;
}

.actions .ghost {
  background: rgba(37, 99, 235, 0.15);
}

.actions .warn {
  background: rgba(220, 38, 38, 0.15);
  color: #991b1b;
}

.refresh-indicator {
  grid-column: 1 / -1;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-primary);
  animation: pulse 1.4s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
}
</style>
