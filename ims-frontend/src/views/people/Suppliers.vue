<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-brand">Suppliers</h1>

    <button @click="addSupplier" class="bg-brand text-white px-3 py-1 rounded">Add Supplier</button>

    <DataTable
      :data="suppliers"
      :columns="['id','name','phone','email','status']"
      @edit="editSupplier"
      @delete="deleteSupplier"
      @export="exportData"
    />
  </div>
</template>

<script setup>
import DataTable from '@/components/DataTable.vue'
import { useSuppliersStore } from '@/stores/suppliers'

const store = useSuppliersStore()
const suppliers = store.suppliers

function addSupplier() {
  const id = suppliers.length + 1
  suppliers.push({
    id,
    name: 'New Supplier',
    phone: '09xxxxxxxx',
    email: 'new@supplier.com',
    status: 'active',
    business_id: '11111111-1111-1111-1111-111111111111',
    created_at: new Date().toISOString()
  })
}

function editSupplier(supplier) {
  const name = prompt('Supplier Name', supplier.name)
  const phone = prompt('Contact Number', supplier.phone)
  const email = prompt('Email', supplier.email)
  if (name) supplier.name = name
  if (phone) supplier.phone = phone
  if (email) supplier.email = email
}

function deleteSupplier(supplier) {
  if (confirm('Delete this supplier?')) {
    const index = suppliers.findIndex(s => s.id === supplier.id)
    if (index >= 0) suppliers.splice(index, 1)
  }
}

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}
</script>
