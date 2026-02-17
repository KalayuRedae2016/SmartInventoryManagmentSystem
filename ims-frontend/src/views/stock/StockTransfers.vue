<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">🔁 Stock Transfers</h1>

      <button
        v-if="can('stock.transfer')"
        class="btn-primary"
        @click="showForm = true"
      >
        ➕ New Transfer
      </button>
    </div>

    <StockTransferModal
      v-model:show="showForm"
      :products="products"
      :warehouses="warehouses"
      :error-message="errorMessage"
      :get-stock="getStock"
      @submit="submit"
    />

    <!-- Transfers Table -->
    <div class="bg-white rounded shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="th">Product</th>
            <th class="th">From</th>
            <th class="th">To</th>
            <th class="th">Qty</th>
            <th class="th">Status</th>
            <th class="th text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="t in transfers"
            :key="t.id"
            class="border-t hover:bg-gray-50"
          >
            <td class="td">{{ getProductName(t.productId) }}</td>
            <td class="td">{{ getWarehouseName(t.fromWarehouseId) }}</td>
            <td class="td">{{ getWarehouseName(t.toWarehouseId) }}</td>
            <td class="td font-semibold">{{ t.quantity }}</td>
            <td class="td">
              <span :class="statusClass(t.status)">{{ t.status }}</span>
            </td>
            <td class="td text-right space-x-2">
              <button
                v-if="can('stock.approve') && t.status === 'pending'"
                class="btn-approve"
                @click="approve(t)"
              >
                ✔ Approve
              </button>
              <button
                v-if="can('stock.approve') && t.status === 'pending'"
                class="btn-reject"
                @click="reject(t)"
              >
                ✖ Reject
              </button>
            </td>
          </tr>

          <tr v-if="!transfers.length">
            <td colspan="6" class="p-6 text-center text-gray-500">
              No stock transfers found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useStockTransfersStore } from '@/stores/stockTransfers'
import { useWarehouseStore } from '@/stores/warehouse'
import { useProductsStore } from '@/stores/products'
import StockTransferModal from './StockTransferModal.vue'
import { useStockStore } from '@/stores/stock'

// Stores
const auth = useAuthStore()
const transferStore = useStockTransfersStore()
const warehouseStore = useWarehouseStore()
const productStore = useProductsStore()
const stockStore = useStockStore()

// Permissions
const can = auth.can

// Modal & Form
const showForm = ref(false)
const errorMessage = ref('')

// Fetch data
onMounted(async () => {
  await Promise.all([
    transferStore.fetchTransfers(),
    warehouseStore.fetchWarehouses(),
    productStore.fetchProducts()
  ])
})

// Computed
const transfers = computed(() => transferStore.transfers)
const warehouses = computed(() => warehouseStore.warehouses)
const products = computed(() => productStore.products)

// Helpers
const getProductName = id => products.value.find(p => p.id === id)?.name || '—'
const getWarehouseName = id => warehouses.value.find(w => w.id === id)?.name || '—'
const statusClass = status => ({
  pending: 'badge badge-pending',
  approved: 'badge badge-approved',
  rejected: 'badge badge-rejected'
}[status] || 'badge')

// Get available stock for a product in a warehouse
const getStock = (warehouseId, productId) => {
  const warehouse = warehouseStore.warehouses.find(w => w.id === warehouseId)
  return warehouse?.stock?.[productId] || 0
}

// Actions
function submit(form) {
  errorMessage.value = ''

  if (!form.productId || !form.fromWarehouseId || !form.toWarehouseId) {
    errorMessage.value = 'Please select product and warehouses.'
    return
  }
  if (form.fromWarehouseId === form.toWarehouseId) {
    errorMessage.value = 'From and To warehouse cannot be the same.'
    return
  }

  if (form.quantity > getStock(form.fromWarehouseId, form.productId)) {
    errorMessage.value = 'Insufficient stock in source warehouse.'
    return
  }

  transferStore.addTransfer({
    ...form,
    status: 'pending',
    createdBy: auth.role,
    createdAt: new Date().toISOString()
  })

  closeForm()
}

function closeForm() {
  showForm.value = false
  errorMessage.value = ''
}

function approve(transfer) {
  transferStore.updateTransfer({ id: transfer.id, status: 'approved' })

  // Adjust stock using warehouse helpers
  warehouseStore.decreaseStock(transfer.fromWarehouseId, transfer.productId, transfer.quantity)
  warehouseStore.increaseStock(transfer.toWarehouseId, transfer.productId, transfer.quantity)

  const productName = getProductName(transfer.productId)
  const fromName = getWarehouseName(transfer.fromWarehouseId)
  const toName = getWarehouseName(transfer.toWarehouseId)
  stockStore.applyTransfer({
    productName,
    fromWarehouse: fromName,
    toWarehouse: toName,
    quantity: transfer.quantity
  })
}

function reject(transfer) {
  transferStore.updateTransfer({ id: transfer.id, status: 'rejected' })
}
</script>

<style scoped>
/* Brand */
.bg-brand {
  background-color: rgb(76, 38, 131);
}

/* Inputs */
.input {
  width: 100%;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 6px;
}

/* Table */
.th {
  padding: 10px;
  text-align: left;
  font-weight: 600;
}
.td {
  padding: 10px;
}

/* Status Badges */
.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: capitalize;
}
.badge-pending {
  background: #fef3c7;
  color: #92400e;
}
.badge-approved {
  background: #dcfce7;
  color: #166534;
}
.badge-rejected {
  background: #fee2e2;
  color: #991b1b;
}

/* Buttons */
.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
}
.btn-secondary {
  background: #eee;
  padding: 6px 14px;
  border-radius: 6px;
}
.btn-approve {
  color: #166534;
  font-weight: 600;
}
.btn-reject {
  color: #991b1b;
  font-weight: 600;
}
</style>
