<template>
  <div class="lists-layout">
    <aside class="panel filters-panel">
      <div class="panel-heading">
        <h2>筛选我的清单</h2>
        <p>组合活动名称、状态与时间区间，快速定位目标。</p>
      </div>
      <form class="filters" @submit.prevent="handleSearch">
        <div class="field-grid">
          <label>
            活动名称
            <input v-model.trim="filters.activityName" type="text" placeholder="模糊搜索" />
          </label>
          <label>
            报销状态
            <select v-model="filters.status">
              <option value="">全部</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label>
            开始时间
            <input v-model="filters.startTime" type="date" @input="resetPreset" />
          </label>
          <label>
            结束时间
            <input v-model="filters.endTime" type="date" @input="resetPreset" />
          </label>
        </div>
        <div class="preset-row" aria-label="快速时间范围">
          <span>快速时间</span>
          <button
            v-for="preset in presetOptions"
            :key="preset.key"
            type="button"
            :class="{ 'is-active': activePreset === preset.key }"
            @click="applyPreset(preset.key)"
          >
            {{ preset.label }}
          </button>
        </div>
        <div class="filter-actions">
          <button type="submit">应用筛选</button>
          <button type="button" class="ghost" @click="resetFilters">重置</button>
        </div>
      </form>
      <div class="create-card">
        <h3>快速创建报销清单</h3>
        <p>每个清单绑定唯一活动名称，创建后即可录入账单。</p>
        <form @submit.prevent="handleCreate">
          <input v-model.trim="newListName" type="text" placeholder="活动名称" required />
          <button type="submit" :disabled="creating">
            {{ creating ? '创建中...' : '创建清单' }}
          </button>
        </form>
      </div>
    </aside>

    <section class="content-column">
      <section class="panel status-board">
        <header class="panel-header">
          <div>
            <h2>状态看板</h2>
            <p>当前页 {{ lists.length }} / 总计 {{ pagination.total }} 条</p>
          </div>
          <div v-if="refreshing" class="refresh-pill">同步中...</div>
        </header>
        <div class="status-grid">
          <article
            v-for="bucket in statusInsights"
            :key="bucket.value"
            class="status-card"
            :style="{ borderColor: bucket.color }"
          >
            <div class="status-card__meta">
              <span class="dot" :style="{ background: bucket.color }" />
              <strong>{{ bucket.label }}</strong>
              <small>{{ bucket.description }}</small>
            </div>
            <div class="status-card__value">
              <span>{{ bucket.count }}</span>
              <small>{{ formatCurrency(bucket.amount) }}</small>
            </div>
            <button type="button" @click="quickFilterStatus(bucket.value)">仅看此状态</button>
          </article>
        </div>
      </section>

      <section class="panel table-panel">
        <header class="panel-header">
          <div>
            <h2>我的报销清单</h2>
            <p>{{ pagination.total }} 条记录</p>
          </div>
          <div class="pager">
            <button type="button" :disabled="pagination.pageNum === 1" @click="changePage(-1)">上一页</button>
            <button type="button" :disabled="!hasMore" @click="changePage(1)">下一页</button>
          </div>
        </header>
        <div v-if="loading" class="skeleton">加载中...</div>
        <template v-else>
          <div v-if="lists.length" class="collection">
            <table class="list-table desktop-only">
              <thead>
                <tr>
                  <th>活动名称</th>
                  <th>总金额</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>更新时间</th>
                  <th>状态更新</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in lists" :key="item.listId">
                  <td>{{ item.activityName }}</td>
                  <td>{{ formatCurrency(item.totalAmount) }}</td>
                  <td>
                    <StatusBadge :status="item.status" />
                  </td>
                  <td>{{ formatDateTime(item.createTime) }}</td>
                  <td>{{ formatDateTime(item.updateTime) }}</td>
                  <td>
                    <select
                      class="status-dropdown status-dropdown--compact"
                      v-model.number="statusDraft[item.listId]"
                      @change="submitStatus(item)"
                    >
                      <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </td>
                  <td class="actions">
                    <button type="button" class="ghost" @click="viewDetail(item.listId)">详情</button>
                    <button type="button" class="warn" @click="deleteList(item.listId)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="list-cards mobile-only">
              <article v-for="item in lists" :key="item.listId">
                <header>
                  <div>
                    <h3>{{ item.activityName }}</h3>
                    <small>{{ formatDateTime(item.createTime) }}</small>
                  </div>
                  <StatusBadge :status="item.status" />
                </header>
                <p class="amount">{{ formatCurrency(item.totalAmount) }}</p>
                <div class="card-row">
                  <label>状态</label>
                  <select v-model.number="statusDraft[item.listId]" @change="submitStatus(item)">
                    <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>
                <div class="card-actions">
                  <button type="button" class="ghost" @click="viewDetail(item.listId)">详情</button>
                  <button type="button" class="warn" @click="deleteList(item.listId)">删除</button>
                </div>
              </article>
            </div>
          </div>
          <EmptyState v-else>暂无清单，先创建一个吧</EmptyState>
        </template>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { format, subDays, subMonths } from 'date-fns'
import { useRouter } from 'vue-router'
import * as listApi from '@/api/lists'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { STATUS_OPTIONS as statusOptions } from '@/utils/constants'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { ReimbursementListItem, ReimbursementStatus } from '@/types/list'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const toast = useToast()

const filters = reactive({
  activityName: '',
  status: '',
  startTime: '',
  endTime: ''
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const lists = ref<ReimbursementListItem[]>([])
const loading = ref(true)
const refreshing = ref(false)
const creating = ref(false)
const newListName = ref('')
const statusDraft = reactive<Record<number, number>>({})
const activePreset = ref('')

const withDayBoundary = (value: string, boundary: 'start' | 'end') => {
  if (!value) return undefined
  return `${value} ${boundary === 'start' ? '00:00:00' : '23:59:59'}`
}

const hasMore = computed(() => pagination.pageNum * pagination.pageSize < pagination.total)

const statusInsights = computed(() => {
  const buckets = statusOptions.map((meta) => ({
    ...meta,
    count: 0,
    amount: 0
  }))
  const bucketMap = new Map<ReimbursementStatus, (typeof buckets)[number]>()
  buckets.forEach((bucket) => bucketMap.set(bucket.value, bucket))
  lists.value.forEach((item) => {
    const target = bucketMap.get(item.status)
    if (target) {
      target.count += 1
      target.amount += Number(item.totalAmount || 0)
    }
  })
  return buckets
})

const presetOptions = [
  { key: '7d', label: '近 7 天', range: () => ({ start: subDays(new Date(), 6), end: new Date() }) },
  { key: '30d', label: '近 30 天', range: () => ({ start: subDays(new Date(), 29), end: new Date() }) },
  { key: 'half', label: '近半年', range: () => ({ start: subMonths(new Date(), 6), end: new Date() }) }
]

const toInputDate = (value: Date) => format(value, 'yyyy-MM-dd')

const applyPreset = (key: string) => {
  const preset = presetOptions.find((option) => option.key === key)
  if (!preset) return
  const { start, end } = preset.range()
  filters.startTime = toInputDate(start)
  filters.endTime = toInputDate(end)
  activePreset.value = key
  pagination.pageNum = 1
  fetchLists()
}

const resetPreset = () => {
  activePreset.value = ''
}

const fetchLists = async ({ silent = false } = {}) => {
  if (silent) {
    refreshing.value = true
  } else {
    loading.value = true
  }
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      activityName: filters.activityName || undefined,
      status:
        filters.status === '' ? undefined : (Number(filters.status) as ReimbursementStatus),
      startTime: withDayBoundary(filters.startTime, 'start'),
      endTime: withDayBoundary(filters.endTime, 'end')
    }
    const data = await listApi.fetchLists(params)
    const payload = data.list ?? data.records ?? []
    lists.value = payload
    pagination.total = data.total ?? payload.length
    payload.forEach((item) => {
      statusDraft[item.listId] = item.status
    })
  } catch (error) {
    toast.error('无法获取清单列表')
  } finally {
    if (silent) {
      refreshing.value = false
    } else {
      loading.value = false
    }
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchLists()
}

const resetFilters = () => {
  filters.activityName = ''
  filters.status = ''
  filters.startTime = ''
  filters.endTime = ''
  resetPreset()
  pagination.pageNum = 1
  fetchLists()
}

const changePage = (delta: number) => {
  pagination.pageNum = Math.max(1, pagination.pageNum + delta)
  fetchLists()
}

const quickFilterStatus = (status: ReimbursementStatus) => {
  filters.status = String(status)
  pagination.pageNum = 1
  fetchLists()
}

const handleCreate = async () => {
  if (!newListName.value) return
  creating.value = true
  try {
    await listApi.createList({ activityName: newListName.value })
    toast.success('清单创建成功')
    newListName.value = ''
    await fetchLists({ silent: true })
  } catch (error) {
    toast.error('创建失败，请确认同名限制')
  } finally {
    creating.value = false
  }
}

const submitStatus = async (item: ReimbursementListItem) => {
  const status = statusDraft[item.listId]
  if (status === undefined || status === item.status) return
  try {
    await listApi.updateListStatus(item.listId, { status: status as ReimbursementStatus })
    toast.success('状态已更新')
    await fetchLists({ silent: true })
  } catch (error) {
    statusDraft[item.listId] = item.status
    toast.error('状态更新失败')
  }
}

const deleteList = async (listId: number) => {
  if (!window.confirm('删除后将级联移除账单，确认继续？')) return
  try {
    await listApi.deleteList(listId)
    toast.info('清单已删除')
    await fetchLists({ silent: true })
  } catch (error) {
    toast.error('删除失败')
  }
}

const viewDetail = (listId: number) => {
  router.push({ name: 'list-detail', params: { listId } })
}

onMounted(fetchLists)
</script>

<style scoped>
.lists-layout {
  display: grid;
  grid-template-columns: minmax(280px, 340px) 1fr;
  gap: 1.5rem;
}

.panel {
  background: var(--surface);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

.filters-panel {
  position: sticky;
  top: 1rem;
  align-self: start;
}

.panel-heading p {
  color: var(--text-muted);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.filters label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
}

.preset-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.preset-row button {
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  background: white;
  cursor: pointer;
  color: inherit;
}

.preset-row button.is-active {
  border-color: rgba(37, 99, 235, 0.5);
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.filters input,
.filters select {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 0.65rem;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-actions button {
  border-radius: 12px;
  border: none;
  padding: 0.75rem;
  cursor: pointer;
}

.filter-actions .ghost {
  background: rgba(15, 23, 42, 0.05);
}

.filter-actions button:not(.ghost) {
  background: rgba(37, 99, 235, 0.9);
  color: white;
}

.create-card {
  margin-top: 2rem;
  padding: 1rem;
  border-radius: 18px;
  background: rgba(37, 99, 235, 0.08);
}

.create-card form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.create-card input {
  border-radius: 12px;
  border: 1px solid rgba(37, 99, 235, 0.3);
  padding: 0.6rem 0.75rem;
}

.create-card button {
  border: none;
  padding: 0.65rem;
  border-radius: 12px;
  background: linear-gradient(120deg, #38bdf8, #6366f1);
  color: white;
}

.content-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-card {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 18px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-card__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-card__value {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.status-card__value span {
  font-size: 1.8rem;
  font-weight: 700;
}

.status-card button {
  align-self: flex-start;
  border: none;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  background: rgba(15, 23, 42, 0.05);
  cursor: pointer;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.table-panel {
  overflow: hidden;
}

.pager button {
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 0.35rem 0.75rem;
  margin-left: 0.35rem;
}

.list-table {
  width: 100%;
  border-collapse: collapse;
}

.list-table th,
.list-table td {
  padding: 0.85rem;
  text-align: left;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.actions {
  display: flex;
  gap: 0.35rem;
}

.actions button {
  border-radius: 999px;
  border: none;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
}

.actions .ghost {
  background: rgba(37, 99, 235, 0.1);
}

.actions .warn {
  background: rgba(220, 38, 38, 0.12);
  color: #991b1b;
}

.skeleton {
  padding: 2rem;
  text-align: center;
}

.refresh-pill {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  font-size: 0.85rem;
}

.status-dropdown--compact {
  min-width: 140px;
}

.collection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.list-cards article {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 18px;
  padding: 1rem;
}

.list-cards header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.list-cards .amount {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.5rem 0;
}

.card-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.card-row select {
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 0.5rem;
}

.card-actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.desktop-only {
  display: table;
}

.mobile-only {
  display: none;
}

@media (max-width: 1024px) {
  .lists-layout {
    grid-template-columns: 1fr;
  }

  .filters-panel {
    position: static;
  }
}

@media (max-width: 720px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: grid;
  }
}
</style>
