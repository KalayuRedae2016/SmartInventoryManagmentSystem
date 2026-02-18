<template>
  <div class="space-y-4">
    <div class="flex items-end justify-between border-b pb-3">
      <h1 class="text-2xl font-bold text-brand">Suppliers</h1>
      <button
        v-if="canAdd"
        @click="openAddModal"
        class="bg-brand text-white px-3 py-1 rounded hover:bg-purple-700 transition"
      >
        Add Supplier
      </button>
    </div>

    <Datatable
      :data="suppliers"
      :columns="columns"
      :can-edit="true"
      :can-delete="true"
      title="Suppliers"
      @edit="openEditModal"
      @delete="deleteSupplier"
    />

    <Modal
      v-model:show="modalVisible"
      :title="editItem?.id ? 'Edit Supplier' : 'Add Supplier'"
      :modelValue="editItem"
      type="form"
      @submit="saveSupplier"
    >
      <template #default="{ formData }">
        <div class="space-y-2">
          <input v-model="formData.code" placeholder="Code" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.name" placeholder="Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.email" placeholder="Email" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.phone" placeholder="Phone" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.address" placeholder="Address" class="w-full border px-2 py-1 rounded" />
          <select v-model="formData.status" class="w-full border px-2 py-1 rounded">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import Datatable from '@/components/Datatable.vue'
import Modal from '@/components/Modal.vue'
import { useSuppliersStore } from '@/stores/suppliers'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const canAdd = auth.can('suppliers.create')

const suppliersStore = useSuppliersStore()
const suppliers = suppliersStore.suppliers

const columns = ['name', 'email', 'phone', 'address', 'status']

const modalVisible = ref(false)
const editItem = reactive({})

onMounted(() => {
  suppliersStore.fetchSuppliers()
})

function openAddModal() {
  Object.assign(editItem, {
    id: null,
    code: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active'
  })
  modalVisible.value = true
}

function openEditModal(row) {
  Object.assign(editItem, { ...row })
  modalVisible.value = true
}

function deleteSupplier(row) {
  if (confirm(`Are you sure you want to delete ${row.name}?`)) {
    suppliersStore.deleteSupplier(row.id)
  }
}

function saveSupplier(supplier) {
  if (supplier.id) {
    suppliersStore.updateSupplier(supplier)
  } else {
    suppliersStore.addSupplier({
      ...supplier,
      business_id: '11111111-1111-1111-1111-111111111111',
      created_at: new Date().toISOString()
    })
  }
}
</script>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
.bg-brand { background-color: rgb(76, 38, 131); }
</style>
