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
      :canEdit="true"
      :canDelete="true"
      @edit="openEditModal"
      @delete="openConfirmDelete"
      @export="exportData"
    />

    <!-- Add/Edit Modal -->
    <Modal
      v-model:show="modalVisible"
      :title="editItem ? 'Edit Warehouse' : 'Add Warehouse'"
      type="form"
      @submit="saveWarehouse"
    >
      <template #default="{ formData }">
        <div class="space-y-2">
          <input v-model="formData.name" placeholder="Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.location" placeholder="Location" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.managerName" placeholder="Manager Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.phone" placeholder="Phone" class="w-full border px-2 py-1 rounded" />
          <select v-model="formData.status" class="w-full border px-2 py-1 rounded">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
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
let rowToDelete = null

onMounted(() => {
  store.fetchWarehouses()
})

function openAddModal() {
  Object.assign(editItem, {
    id: null,
    code: '',
    name: '',
    location: '',
    managerName: '',
    phone: '',
    email: '',
    status: 'active',
    businessId: 1,
    createdAt: new Date().toISOString()
  })
  modalVisible.value = true
}

function openEditModal(row) {
  Object.assign(editItem, row)
  modalVisible.value = true
}

function openConfirmDelete(row) {
  rowToDelete = row
  confirmVisible.value = true
}

async function saveWarehouse(item) {
  if (item.id) await store.updateWarehouse(item)
  else await store.addWarehouse(item)
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
</script>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
</style>
