<template>
  <div class="space-y-4">
    <div class="flex items-center justify-end">
      <button v-if="canCreate" class="btn-primary" @click="openAddModal">+ Add Purchase Item</button>
    </div>

    <div class="bg-white rounded shadow overflow-x-auto p-4">
      <table class="w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="th">ID</th>
            <th class="th">Purchase ID</th>
            <th class="th">Business ID</th>
            <th class="th">Warehouse ID</th>
            <th class="th">Product ID</th>
            <th class="th">Quantity</th>
            <th class="th">Unit Price</th>
            <th class="th">Total</th>
            <th class="th">Status</th>
            <th class="th">Created At</th>
            <th class="th text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.id" class="border-t hover:bg-gray-50">
            <td class="td">{{ row.id }}</td>
            <td class="td">{{ row.purchaseId }}</td>
            <td class="td">{{ row.businessId }}</td>
            <td class="td">{{ row.warehouseId }}</td>
            <td class="td">{{ row.productId }}</td>
            <td class="td">{{ row.quantity }}</td>
            <td class="td">{{ row.unitPrice }}</td>
            <td class="td">{{ row.total }}</td>
            <td class="td">
              <span :class="row.isActive ? 'badge badge-active' : 'badge badge-inactive'">
                {{ row.isActive ? 'active' : 'inactive' }}
              </span>
            </td>
            <td class="td">{{ formatDate(row.createdAt) }}</td>
            <td class="td text-right">
              <div class="inline-flex items-center gap-2">
                <button
                  v-if="canUpdate"
                  class="icon-btn"
                  :class="row.isActive ? 'icon-deactivate' : 'icon-activate'"
                  :title="row.isActive ? 'Deactivate' : 'Activate'"
                  @click="toggleStatus(row)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 19a8 8 0 1 1 8-8 1 1 0 1 1-2 0 6 6 0 1 0-6 6 1 1 0 1 1 0 2Z" />
                  </svg>
                </button>
                <button v-if="canUpdate" class="icon-btn icon-edit" title="Edit" @click="openEditModal(row)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 17.3V21h3.7l10.9-10.9-3.7-3.7L3 17.3Zm18.7-11a1 1 0 0 0 0-1.4L19.1 2.3a1 1 0 0 0-1.4 0l-1.9 1.9 3.7 3.7 2.2-1.6Z" />
                  </svg>
                </button>
                <button v-if="canDelete" class="icon-btn icon-delete" title="Delete" @click="askDelete(row)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="11" class="p-6 text-center text-gray-500">No purchase items found</td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="p-4 text-center text-purple-800">Loading...</div>
    </div>

    <Modal
      v-model:show="modalVisible"
      :title="editItem.id ? 'Edit Purchase Item' : 'Add Purchase Item'"
      :modelValue="editItem"
      type="form"
      @submit="saveItem"
    >
      <template #default="{ formData }">
        <div class="space-y-2">
          <input v-if="formData.id" v-model.number="formData.id" type="number" class="w-full border px-2 py-1 rounded bg-gray-100" readonly />
          <select v-model.number="formData.purchaseId" class="w-full border px-2 py-1 rounded" @change="onPurchaseSelected(formData)">
            <option :value="null" disabled>Select Purchase</option>
            <option v-for="p in purchases" :key="p.id" :value="p.id">
              #{{ p.id }} | Invoice: {{ p.invoiceNumber || '-' }} | Total: {{ p.totalAmount }}
            </option>
          </select>
          <input
            :value="selectedPurchaseWarehouseName(formData)"
            type="text"
            class="w-full border px-2 py-1 rounded bg-gray-100"
            placeholder="Warehouse (auto from purchase)"
            readonly
          />
          <select v-model.number="formData.productId" class="w-full border px-2 py-1 rounded">
            <option :value="null" disabled>Select Product</option>
            <option v-for="p in products" :key="p.id" :value="p.id">
              {{ p.name }} (ID: {{ p.id }})
            </option>
          </select>
          <input v-model.number="formData.quantity" type="number" placeholder="Quantity" class="w-full border px-2 py-1 rounded" />
          <input v-model.number="formData.unitPrice" type="number" step="0.01" placeholder="Unit Price" class="w-full border px-2 py-1 rounded" />
          <p class="text-xs text-gray-500">
            Line total: {{ Number(formData.quantity || 0) * Number(formData.unitPrice || 0) }}
          </p>
          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        </div>
      </template>
    </Modal>

    <Modal
      v-model:show="confirmVisible"
      :title="confirmTitle"
      type="confirm"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePurchaseItemsStore } from '@/stores/purchaseItems'
import { usePurchasesStore } from '@/stores/purchases'
import { useProductsStore } from '@/stores/products'
import { useWarehouseStore } from '@/stores/warehouse'
import Modal from '@/components/Modal.vue'

const auth = useAuthStore()
const store = usePurchaseItemsStore()
const purchasesStore = usePurchasesStore()
const productsStore = useProductsStore()
const warehousesStore = useWarehouseStore()

const items = computed(() => store.items)
const loading = computed(() => store.loading)
const purchases = computed(() => purchasesStore.purchases || [])
const products = computed(() => productsStore.products || [])
const warehouses = computed(() => warehousesStore.warehouses || [])
const canCreate = computed(() => auth.hasPermission('purchases.create'))
const canUpdate = computed(() => auth.hasPermission('purchases.update'))
const canDelete = computed(() => auth.hasPermission('purchases.delete'))

const modalVisible = ref(false)
const confirmVisible = ref(false)
const formError = ref('')
const rowToDelete = ref(null)
const editItem = reactive({})

onMounted(() => {
  Promise.all([
    store.fetchPurchaseItems(),
    purchasesStore.fetchPurchases(),
    productsStore.fetchProducts(),
    warehousesStore.fetchWarehouses()
  ])
})

function openAddModal() {
  formError.value = ''
  Object.assign(editItem, {
    id: null,
    purchaseId: null,
    warehouseId: null,
    productId: null,
    quantity: null,
    unitPrice: null
  })
  modalVisible.value = true
}

function openEditModal(row) {
  formError.value = ''
  Object.assign(editItem, {
    ...row
  })
  modalVisible.value = true
}

async function saveItem(formData) {
  formError.value = ''
  const selectedPurchase = purchases.value.find(p => Number(p.id) === Number(formData.purchaseId))
  if (!formData.purchaseId || !formData.productId || !formData.quantity || !formData.unitPrice) {
    formError.value = 'purchaseId, productId, quantity and unitPrice are required.'
    return
  }
  if (!selectedPurchase) {
    formError.value = 'Selected purchase is invalid.'
    return
  }
  if (Number(formData.quantity) <= 0 || Number(formData.unitPrice) <= 0) {
    formError.value = 'Quantity and unitPrice must be positive values.'
    return
  }

  try {
    const payload = {
      ...formData,
      warehouseId: Number(selectedPurchase.warehouseId ?? selectedPurchase.warehouse_id),
      purchaseId: Number(formData.purchaseId),
      productId: Number(formData.productId),
      quantity: Number(formData.quantity),
      unitPrice: Number(formData.unitPrice)
    }
    if (formData.id) {
      await store.updatePurchaseItem(payload)
    } else {
      await store.addPurchaseItem(payload)
    }
    modalVisible.value = false
    await store.fetchPurchaseItems()
  } catch (error) {
    formError.value = error?.response?.data?.message || 'Unable to save purchase item.'
  }
}

function askDelete(row) {
  rowToDelete.value = row
  confirmVisible.value = true
}

const confirmTitle = computed(() => {
  const id = rowToDelete.value?.id
  return id ? `Delete purchase item #${id}?` : 'Delete this purchase item?'
})

async function confirmDelete() {
  if (!rowToDelete.value) return
  await store.deletePurchaseItem(rowToDelete.value.id)
  rowToDelete.value = null
}

async function toggleStatus(row) {
  await store.togglePurchaseItemStatus(row.id, row.isActive)
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

function onPurchaseSelected(formData) {
  const selectedPurchase = purchases.value.find(p => Number(p.id) === Number(formData.purchaseId))
  formData.warehouseId = selectedPurchase
    ? Number(selectedPurchase.warehouseId ?? selectedPurchase.warehouse_id)
    : null
}

function selectedPurchaseWarehouseName(formData) {
  const selectedPurchase = purchases.value.find(p => Number(p.id) === Number(formData.purchaseId))
  if (!selectedPurchase) return ''
  const warehouseId = Number(selectedPurchase.warehouseId ?? selectedPurchase.warehouse_id)
  const warehouse = warehouses.value.find(w => Number(w.id) === warehouseId)
  return warehouse?.name || `Warehouse ID: ${warehouseId}`
}
</script>

<style scoped>
.th { padding: 10px; text-align: left; font-weight: 600; }
.td { padding: 10px; }
.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
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
.icon-edit { color: #2563eb; }
.icon-delete { color: #dc2626; }
.icon-activate { color: #16a34a; }
.icon-deactivate { color: #d97706; }
.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: lowercase;
}
.badge-active { background: #dcfce7; color: #166534; }
.badge-inactive { background: #fee2e2; color: #991b1b; }
</style>
