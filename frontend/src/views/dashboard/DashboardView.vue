<template>
  <section class="dashboard">
    <header class="panel-header">
      <div class="intro">
        <h2>个人报销大盘</h2>
        <p>选择时间区间，快速聚焦仍未完成的清单</p>
      </div>
      <div class="filter-stack">
        <form class="filters" @submit.prevent="loadData">
          <label>
            开始日期
            <input v-model="filters.startDate" type="date" @input="resetPreset" />
          </label>
          <label>
            结束日期
            <input v-model="filters.endDate" type="date" @input="resetPreset" />
          </label>
          <button type="submit">刷新</button>
        </form>
        <div class="filter-row">
          <div class="preset-group" aria-label="快速时间范围">
            <button
              v-for="preset in presetOptions"
              :key="preset.key"
              type="button"
              class="pill-button"
              :class="{ 'is-active': preset.key === activePreset }"
              @click="applyPreset(preset.key)"
            >
              {{ preset.label }}
            </button>
          </div>
          <div class="focus-group" aria-label="状态聚焦">
            <span>聚焦</span>
            <button
              v-for="scope in focusScopes"
              :key="scope.key"
              type="button"
              class="pill-button"
              :class="{ 'is-active': scope.key === focusScope }"
              @click="setFocusScope(scope.key)"
            >
              {{ scope.label }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="cards">
      <DataCard label="报销清单" :value="summary.totalListCount.toString()">
        <template #footer>
          <div class="card-hint">完成率 {{ completionRate }}%</div>
        </template>
      </DataCard>
      <DataCard label="总金额" :value="formatCurrency(summary.totalAmount)">
        <template #footer>
          <div class="card-hint">已回款 {{ formatCurrency(summary.repaidAmount) }}</div>
        </template>
      </DataCard>
      <DataCard label="已回款" :value="formatCurrency(summary.repaidAmount)">
        <template #footer>
          <div class="card-hint">占比 {{ completionRate }}%</div>
        </template>
      </DataCard>
      <DataCard label="未回款" :value="formatCurrency(summary.unrepaidAmount)">
        <template #footer>
          <div class="card-hint">未完成 {{ incompleteRate }}%</div>
        </template>
      </DataCard>
    </div>

    <section class="panel spotlight">
      <div>
        <h3>未完成清单聚焦</h3>
        <p>未报销 + 已上交的清单共 {{ incompleteCount }} 个</p>
      </div>
      <div class="spotlight-stats">
        <div>
          <span class="label">未报销</span>
          <strong>{{ summary.unrepaidListCount }}</strong>
        </div>
        <div>
          <span class="label">已上交</span>
          <strong>{{ summary.submittedListCount }}</strong>
        </div>
        <div>
          <span class="label">未完成占比</span>
          <strong>{{ incompleteRate }}%</strong>
        </div>
        <button type="button" class="focus-btn" @click="setFocusScope('incomplete')">
          聚焦未完成
        </button>
      </div>
      <div class="progress">
        <span class="fill" :style="{ width: `${incompleteRate}%` }" />
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>状态占比</h3>
          <p>展示未报销 / 已上交 / 已回款三大态</p>
        </div>
        <small class="panel-meta">
          当前视图：{{ focusScope === 'all' ? '全部清单' : '仅未完成' }}
        </small>
      </div>
      <StatusBreakdown :dataset="filteredStatusData" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import * as dashboardApi from '@/api/dashboard'
import type { DashboardSummary, StatusDistributionItem } from '@/types/dashboard'
import DataCard from '@/components/common/DataCard.vue'
import StatusBreakdown from '@/components/charts/StatusBreakdown.vue'
import { formatCurrency } from '@/utils/format'
import { useToast } from '@/composables/useToast'

const filters = reactive({
  startDate: '',
  endDate: ''
})

const summary = reactive<DashboardSummary>({
  totalListCount: 0,
  totalAmount: 0,
  repaidAmount: 0,
  unrepaidAmount: 0,
  unrepaidListCount: 0,
  submittedListCount: 0,
  repaidListCount: 0
})

type FocusScope = 'all' | 'incomplete'

const statusData = ref<StatusDistributionItem[]>([])
const toast = useToast()
const focusScope = ref<FocusScope>('all')
const activePreset = ref<string>('')

const presetOptions = [
  { key: '7d', label: '近 7 天', range: () => ({ start: subDays(new Date(), 6), end: new Date() }) },
  { key: '30d', label: '近 30 天', range: () => ({ start: subDays(new Date(), 29), end: new Date() }) },
  { key: 'month', label: '本月', range: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) }
]

const focusScopes: Array<{ key: FocusScope; label: string }> = [
  { key: 'all', label: '全部状态' },
  { key: 'incomplete', label: '仅未完成' }
]

const toInputDate = (value: Date) => format(value, 'yyyy-MM-dd')

const withDayBoundary = (value: string, boundary: 'start' | 'end') => {
  if (!value) return undefined
  return `${value} ${boundary === 'start' ? '00:00:00' : '23:59:59'}`
}

const buildFilterParams = () => ({
  startDate: withDayBoundary(filters.startDate, 'start'),
  endDate: withDayBoundary(filters.endDate, 'end')
})

const applyPreset = (key: string) => {
  const preset = presetOptions.find((item) => item.key === key)
  if (!preset) return
  const { start, end } = preset.range()
  filters.startDate = toInputDate(start)
  filters.endDate = toInputDate(end)
  activePreset.value = key
  loadData()
}

const resetPreset = () => {
  activePreset.value = ''
}

const setFocusScope = (scope: FocusScope) => {
  if (focusScope.value === scope && scope !== 'all') {
    focusScope.value = 'all'
    return
  }
  focusScope.value = scope
}

const filteredStatusData = computed(() =>
  focusScope.value === 'all' ? statusData.value : statusData.value.filter((item) => item.status !== 2)
)

const completionRate = computed(() => {
  if (!summary.totalListCount) return 0
  return Math.round((summary.repaidListCount / summary.totalListCount) * 100)
})

const incompleteCount = computed(
  () => summary.unrepaidListCount + summary.submittedListCount
)

const incompleteRate = computed(() => {
  if (!summary.totalListCount) return 0
  return Math.round((incompleteCount.value / summary.totalListCount) * 100)
})

const loadData = async () => {
  try {
    const params = buildFilterParams()
    const [summaryData, status] = await Promise.all([
      dashboardApi.getSummary(params),
      dashboardApi.getStatusDistribution(params)
    ])
    Object.assign(summary, summaryData)
    statusData.value = status
  } catch (error) {
    toast.error('大盘数据加载失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.intro {
  max-width: 420px;
}

.filter-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filters label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
}

.filters input {
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 0.4rem 0.6rem;
}

.filters button {
  border-radius: 12px;
  border: none;
  padding: 0.5rem 1rem;
  background: rgba(37, 99, 235, 0.9);
  color: white;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.preset-group,
.focus-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pill-button {
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 999px;
  padding: 0.35rem 0.95rem;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
}

.pill-button.is-active {
  background: rgba(37, 99, 235, 0.1);
  border-color: rgba(37, 99, 235, 0.4);
  color: #1d4ed8;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.card-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.spotlight {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.spotlight-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  align-items: end;
}

.spotlight-stats div {
  background: rgba(15, 23, 42, 0.05);
  border-radius: 14px;
  padding: 0.85rem;
}

.spotlight-stats .label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.spotlight-stats strong {
  font-size: 1.6rem;
}

.focus-btn {
  border: none;
  border-radius: 14px;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  color: white;
  cursor: pointer;
}

.progress {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.progress .fill {
  display: block;
  height: 100%;
  background: rgba(37, 99, 235, 0.9);
}

.panel {
  background: var(--surface);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

.panel-meta {
  color: var(--text-muted);
}
</style>
