<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { USE_MOCK } from '@/config/env'
import StockAdjustModal from './StockAdjustModal.vue'
import { useStockStore } from '@/stores/stock'
import { useWarehouseStore } from '@/stores/warehouse'

const auth = useAuthStore()
const adjustments = ref([])
const loading = ref(false)
const showForm = ref(false)
const stockStore = useStockStore()
const warehouseStore = useWarehouseStore()

const mockAdjustments = [
  { id: 1, product: 'Laptop', warehouseName: 'Main Warehouse', type: 'addition', qty: 10, reason: 'Stock correction', created_at: '2026-02-01' },
  { id: 2, product: 'Mouse', warehouseName: 'Branch Warehouse', type: 'subtraction', qty: 5, reason: 'Damage', created_at: '2026-02-02' },
]

const role = computed(() => auth.user?.role)
const canManage = computed(() => ['owner', 'admin', 'store_keeper'].includes(role.value))

const fetchAdjustments = async () => {
  loading.value = true
  try {
    if (USE_MOCK) {
      adjustments.value = [...mockAdjustments]
      return
    }
    // API call here
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await warehouseStore.fetchWarehouses()
  await stockStore.fetchStock()
  await fetchAdjustments()
})
function addAdjustment(data) {
  adjustments.value.unshift({
    id: Date.now(),
    ...data,
    created_at: new Date().toISOString().slice(0, 10)
  })
  stockStore.adjustStock({
    productName: data.product,
    warehouseName: data.warehouseName || warehouseStore.warehouses[0]?.name || 'Main Warehouse',
    quantity: data.qty,
    type: data.type,
    reason: data.reason
  })
  showForm.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-brand">Stock Adjustments</h2>
      <button
        v-if="canManage"
        class="btn-primary"
        @click="showForm = true"
      >
        + New Adjustment
      </button>
    </div>

    <StockAdjustModal
      v-model:show="showForm"
      :warehouses="warehouseStore.warehouses"
      @submit="addAdjustment"
    />

    <div class="overflow-x-auto bg-white rounded-lg shadow-md">
      <table class="w-full table-auto border-collapse">
        <thead class="thead-brand">
          <tr>
            <th class="px-6 py-3 text-left font-medium">Product</th>
            <th class="px-6 py-3 text-left font-medium">Warehouse</th>
            <th class="px-6 py-3 text-left font-medium">Type</th>
            <th class="px-6 py-3 text-left font-medium">Qty</th>
            <th class="px-6 py-3 text-left font-medium">Reason</th>
            <th class="px-6 py-3 text-left font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in adjustments" :key="a.id" class="hover:bg-gray-50">
            <td class="px-6 py-3">{{ a.product }}</td>
            <td class="px-6 py-3">{{ a.warehouseName }}</td>
            <td class="px-6 py-3 capitalize">{{ a.type }}</td>
            <td class="px-6 py-3">{{ a.qty }}</td>
            <td class="px-6 py-3">{{ a.reason }}</td>
            <td class="px-6 py-3">{{ a.created_at }}</td>
          </tr>
          <tr v-if="!loading && adjustments.length === 0">
            <td colspan="6" class="text-center py-6 text-gray-400">
              No adjustments found
            </td>
          </tr>
          <tr v-if="loading">
            <td colspan="6" class="text-center py-6 text-gray-500">
              Loading...
            </td>
          </tr>
        </tbody>
      </table>
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
</style>
