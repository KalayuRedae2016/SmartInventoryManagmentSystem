<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import StockAdjustModal from './StockAdjustModal.vue'
import { useStockStore } from '@/stores/stock'
import { useWarehouseStore } from '@/stores/warehouse'
import { useProductsStore } from '@/stores/products'
import api, { getResponseData } from '@/services/api'

const auth = useAuthStore()
const adjustments = ref([])
const loading = ref(false)
const showForm = ref(false)
const viewModalVisible = ref(false)
const viewItem = ref(null)
const formError = ref('')

const stockStore = useStockStore()
const warehouseStore = useWarehouseStore()
const productsStore = useProductsStore()

const canManage = computed(() => auth.hasPermission('stock.adjust'))
const warehouses = computed(() => warehouseStore.warehouses || [])
const products = computed(() => productsStore.products || [])

function asList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function normalizeAdjustment(item = {}) {
  return {
    ...item,
    warehouseId: item.warehouseId ?? item.warehouse_id ?? null,
    productId: item.productId ?? item.product_id ?? null,
    userId: item.userId ?? item.user_id ?? null,
    quantity: Math.abs(Number(item.quantity ?? 0)),
    adjustmentType: item.adjustmentType ?? item.adjustment_type ?? '',
    note: item.note || '',
    warehouseName: item.warehouse?.name || item.warehouseName || '-',
    productName: item.product?.name || item.productName || '-',
    createdAt: item.createdAt || item.created_at || ''
  }
}

async function fetchAdjustments() {
  loading.value = true
  try {
    const res = await api.get('/stock-adjustments')
    adjustments.value = asList(getResponseData(res, [])).map(normalizeAdjustment)
  } catch (error) {
    adjustments.value = []
    formError.value = error?.response?.data?.message || error?.message || 'Unable to load adjustments.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await warehouseStore.fetchWarehouses()
  await productsStore.fetchProducts()
  await stockStore.fetchStock()
  await fetchAdjustments()
})

async function addAdjustment(data) {
  formError.value = ''
  try {
    await api.post('/stock-adjustments', {
      warehouseId: Number(data.warehouseId),
      productId: Number(data.productId),
      userId: Number(auth.user?.id || 1),
      quantity: Number(data.quantity || 0),
      adjustmentType: data.adjustmentType,
      note: String(data.note || '')
    })
    await fetchAdjustments()
    await stockStore.fetchStock()
    showForm.value = false
  } catch (error) {
    formError.value = error?.response?.data?.message || error?.message || 'Unable to save adjustment.'
  }
}

function openViewModal(item) {
  viewItem.value = item
  viewModalVisible.value = true
}

async function deleteAdjustment(item) {
  if (!confirm(`Delete stock adjustment #${item.id}?`)) return
  try {
    await api.delete(`/stock-adjustments/${item.id}`)
    await fetchAdjustments()
    await stockStore.fetchStock()
  } catch (error) {
    formError.value = error?.response?.data?.message || error?.message || 'Unable to delete adjustment.'
  }
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-brand">Stock Adjustments</h2>
      <button v-if="canManage" class="btn-primary" @click="showForm = true">
        + New Adjustment
      </button>
    </div>

    <StockAdjustModal
      v-model:show="showForm"
      :warehouses="warehouses"
      :products="products"
      @submit="addAdjustment"
    />

    <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

    <div class="overflow-x-auto bg-white rounded-lg shadow-md">
      <table class="w-full table-auto border-collapse">
        <thead class="thead-brand">
          <tr>
            <th class="px-6 py-3 text-left font-medium">Warehouse ID</th>
            <th class="px-6 py-3 text-left font-medium">Product ID</th>
            <th class="px-6 py-3 text-left font-medium">Quantity</th>
            <th class="px-6 py-3 text-left font-medium">Adjustment Type</th>
            <th class="px-6 py-3 text-left font-medium">Note</th>
            <th class="px-6 py-3 text-left font-medium">Date</th>
            <th class="px-6 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in adjustments" :key="a.id" class="hover:bg-gray-50">
            <td class="px-6 py-3">{{ a.warehouseId || '-' }}</td>
            <td class="px-6 py-3">{{ a.productId || '-' }}</td>
            <td class="px-6 py-3">{{ a.quantity }}</td>
            <td class="px-6 py-3 capitalize">{{ a.adjustmentType || '-' }}</td>
            <td class="px-6 py-3">{{ a.note || '-' }}</td>
            <td class="px-6 py-3">{{ formatDate(a.createdAt) }}</td>
            <td class="px-6 py-3">
              <div class="inline-flex items-center gap-2">
                <button class="icon-btn icon-view" title="View" @click="openViewModal(a)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5c5.5 0 9.5 4.3 10.8 6.1a1.5 1.5 0 0 1 0 1.8C21.5 14.7 17.5 19 12 19S2.5 14.7 1.2 12.9a1.5 1.5 0 0 1 0-1.8C2.5 9.3 6.5 5 12 5Zm0 2C8 7 4.8 10 3.3 12 4.8 14 8 17 12 17s7.2-3 8.7-5C19.2 10 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
                  </svg>
                </button>
                <button v-if="canManage" class="icon-btn icon-delete" title="Delete" @click="deleteAdjustment(a)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && adjustments.length === 0">
            <td colspan="7" class="text-center py-6 text-gray-400">No adjustments found</td>
          </tr>
          <tr v-if="loading">
            <td colspan="7" class="text-center py-6 text-gray-500">Loading...</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="viewModalVisible && viewItem" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded shadow w-full max-w-lg">
        <div class="px-4 py-3 border-b">
          <h3 class="text-lg font-semibold text-gray-800">Adjustment Details</h3>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="detail-row"><span class="detail-label">ID</span><span>{{ viewItem.id || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Warehouse ID</span><span>{{ viewItem.warehouseId || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Product ID</span><span>{{ viewItem.productId || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">User ID</span><span>{{ viewItem.userId || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Quantity</span><span>{{ viewItem.quantity }}</span></div>
          <div class="detail-row"><span class="detail-label">Adjustment Type</span><span class="capitalize">{{ viewItem.adjustmentType || '-' }}</span></div>
          <div class="detail-row sm:col-span-2"><span class="detail-label">Note</span><span>{{ viewItem.note || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Created At</span><span>{{ formatDate(viewItem.createdAt) }}</span></div>
        </div>
        <div class="px-4 py-3 border-t flex justify-end">
          <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition" @click="viewModalVisible = false">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-brand {
  color: rgb(76, 38, 131);
}
.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
}
.thead-brand th {
  background: rgb(76, 38, 131);
  color: white;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
}
.icon-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.icon-view { color: rgb(76, 38, 131); }
.icon-delete { color: #dc2626; }
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-label {
  font-size: 12px;
  color: #6b7280;
}
</style>
