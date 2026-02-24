<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-brand">Customers</h1>

    <button @click="openAddModal" class="bg-brand text-white px-3 py-1 rounded">Add Customer</button>

    <DataTable
      :data="customers"
      :columns="['id', 'name', 'phone', 'email', 'status']"
      @edit="openEditModal"
      @delete="deleteCustomer"
      @export="exportData"
    />

    <Modal
      v-model:show="modalVisible"
      :title="editingId ? 'Edit Customer' : 'Add Customer'"
      :modelValue="form"
      type="form"
      @submit="saveCustomer"
    >
      <template #default="{ formData }">
        <div class="space-y-2">
          <input v-model="formData.name" placeholder="Customer Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.phone" placeholder="Phone Number" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.email" placeholder="Email (optional)" class="w-full border px-2 py-1 rounded" />
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
import { onMounted, reactive, ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { useCustomersStore } from '@/stores/customers'

const store = useCustomersStore()
const customers = store.customers

const modalVisible = ref(false)
const editingId = ref(null)
const form = reactive({
  name: '',
  phone: '',
  email: '',
  status: 'active'
})

onMounted(() => {
  store.fetchCustomers()
})

function openAddModal() {
  editingId.value = null
  form.name = ''
  form.phone = ''
  form.email = ''
  form.status = 'active'
  modalVisible.value = true
}

function openEditModal(customer) {
  editingId.value = customer.id
  form.name = customer.name || ''
  form.phone = customer.phone || ''
  form.email = customer.email || ''
  form.status = customer.status || 'active'
  modalVisible.value = true
}

async function saveCustomer(formData) {
  try {
    if (!String(formData.name || '').trim()) {
      alert('Customer name is required.')
      return
    }

    if (editingId.value) {
      await store.updateCustomer({
        id: editingId.value,
        name: String(formData.name || '').trim(),
        phone: String(formData.phone || '').trim(),
        email: String(formData.email || '').trim(),
        status: formData.status || 'active'
      })
      return
    }

    await store.addCustomer({
      code: `CUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: String(formData.name || '').trim(),
      phone: String(formData.phone || '').trim(),
      email: String(formData.email || '').trim(),
      status: formData.status || 'active'
    })
  } catch (error) {
    const status = error?.response?.status
    if (status === 409) {
      alert('Customer with same name/code already exists. Use a different name.')
      return
    }
    alert(error?.response?.data?.message || error?.message || 'Unable to save customer')
  }
}

async function deleteCustomer(customer) {
  if (!confirm('Delete this customer?')) return
  try {
    await store.deleteCustomer(customer.id)
  } catch (error) {
    alert(error?.response?.data?.message || error?.message || 'Unable to delete customer')
  }
}

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}
</script>
