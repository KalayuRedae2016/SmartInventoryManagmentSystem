<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-brand">Warehouses</h1>

    <button
      @click="openAddModal"
      class="bg-brand text-white px-3 py-1 rounded hover:bg-purple-700 transition"
    >
      Add Warehouse
    </button>

    <DataTable
      :data="warehouses"
      :columns="columns"
      @export="exportData"
    >
      <template #rowActions="{ row }">
        <button class="icon-btn icon-view" title="View" @click="openViewModal(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5c5.5 0 9.5 4.3 10.8 6.1a1.5 1.5 0 0 1 0 1.8C21.5 14.7 17.5 19 12 19S2.5 14.7 1.2 12.9a1.5 1.5 0 0 1 0-1.8C2.5 9.3 6.5 5 12 5Zm0 2C8 7 4.8 10 3.3 12 4.8 14 8 17 12 17s7.2-3 8.7-5C19.2 10 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
          </svg>
        </button>
        <button class="icon-btn icon-edit" title="Edit" @click="openEditModal(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17.3V21h3.7l10.9-10.9-3.7-3.7L3 17.3Zm18.7-11a1 1 0 0 0 0-1.4L19.1 2.3a1 1 0 0 0-1.4 0l-1.9 1.9 3.7 3.7 2.2-1.6Z" />
          </svg>
        </button>
        <button class="icon-btn icon-delete" title="Delete" @click="openConfirmDelete(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
          </svg>
        </button>
      </template>
    </DataTable>

    <!-- Add/Edit Modal -->
    <Modal
      v-model:show="modalVisible"
      :title="editItem.id ? 'Edit Warehouse' : 'Add Warehouse'"
      :modelValue="editItem"
      type="form"
      :closeOnSubmit="false"
      @submit="saveWarehouse"
    >
      <template #default="{ formData }">
        <div class="space-y-2">
          <input
            v-if="isValidId(formData.id)"
            v-model.number="formData.id"
            type="number"
            placeholder="ID (INT)"
            class="w-full border px-2 py-1 rounded bg-gray-100"
            readonly
          />
          <input v-model="formData.name" placeholder="Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.code" placeholder="Code" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.location" placeholder="Location" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.managerName" placeholder="Manager Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.phone" placeholder="Phone" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.email" placeholder="Email" class="w-full border px-2 py-1 rounded" />
          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation -->
    <Modal
      v-model:show="confirmVisible"
      title="Are you sure you want to delete this warehouse?"
      type="confirm"
      @confirm="deleteWarehouse"
    />

    <div v-if="viewModalVisible" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded shadow w-full max-w-2xl">
        <div class="px-4 py-3 border-b">
          <h3 class="text-lg font-semibold text-gray-800">Warehouse Details</h3>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="detail-row"><span class="detail-label">id (INT)</span><span>{{ viewItem.id ?? '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">businessId (INT)</span><span>{{ viewItem.businessId ?? '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">name (STRING)</span><span>{{ viewItem.name || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">code (STRING)</span><span>{{ viewItem.code || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">location (STRING)</span><span>{{ viewItem.location || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">managerName (STRING)</span><span>{{ viewItem.managerName || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">phone (STRING)</span><span>{{ viewItem.phone || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">email (STRING)</span><span>{{ viewItem.email || '-' }}</span></div>
        </div>
        <div class="px-4 py-3 border-t flex justify-end">
          <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition" @click="closeViewModal">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { useWarehouseStore } from '@/stores/warehouse'

const store = useWarehouseStore()
const warehouses = computed(() => store.warehouses)

const columns = ['id','code','name','location','managerName','phone','status']

const modalVisible = ref(false)
const confirmVisible = ref(false)
const editItem = reactive({})
const formError = ref('')
const viewModalVisible = ref(false)
const viewItem = reactive({})
let rowToDelete = null

onMounted(() => {
  store.fetchWarehouses()
})

function openAddModal() {
  formError.value = ''
  Object.assign(editItem, {
    id: null,
    code: '',
    name: '',
    location: '',
    managerName: '',
    phone: '',
    email: '',
    status: 'active'
  })
  modalVisible.value = true
}

function openEditModal(row) {
  formError.value = ''
  Object.assign(editItem, { ...row })
  modalVisible.value = true
}

function openConfirmDelete(row) {
  rowToDelete = row
  confirmVisible.value = true
}

function openViewModal(row) {
  Object.assign(viewItem, row)
  viewModalVisible.value = true
}

function closeViewModal() {
  viewModalVisible.value = false
}

async function saveWarehouse(item) {
  formError.value = ''
  const payload = { ...item }

  if (!String(payload.name || '').trim()) {
    formError.value = 'Warehouse name is required.'
    return
  }

  try {
    if (isValidId(item.id)) await store.updateWarehouse(payload)
    else await store.addWarehouse(payload)
    await store.fetchWarehouses()
    modalVisible.value = false
  } catch (error) {
    formError.value = error?.response?.data?.message || error?.message || 'Failed to save warehouse.'
  }
}

async function deleteWarehouse() {
  if(rowToDelete){
    await store.deleteWarehouse(rowToDelete.id)
    rowToDelete = null
  }
}

function exportData(format){
  alert(`Exporting ${format}`)
}

function isValidId(value) {
  const asNumber = Number(value)
  return Number.isFinite(asNumber) && asNumber > 0
}
</script>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  transition: background-color .15s ease, border-color .15s ease;
}
.icon-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.icon-view { color: rgb(76, 38, 131); }
.icon-view:hover { background: #f5f3ff; border-color: #c4b5fd; }
.icon-edit { color: #2563eb; }
.icon-edit:hover { background: #eff6ff; border-color: #93c5fd; }
.icon-delete { color: #dc2626; }
.icon-delete:hover { background: #fef2f2; border-color: #fca5a5; }
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
