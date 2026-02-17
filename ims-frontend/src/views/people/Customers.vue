<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-brand">Customers</h1>

    <button @click="addCustomer" class="bg-brand text-white px-3 py-1 rounded">Add Customer</button>

    <DataTable
      :data="customers"
      :columns="['id','name','phone','email','status']"
      @edit="editCustomer"
      @delete="deleteCustomer"
      @export="exportData"
    />
  </div>
</template>

<script setup>
import DataTable from '@/components/DataTable.vue'
import { useCustomersStore } from '@/stores/customers'

const store = useCustomersStore()
const customers = store.customers

function addCustomer() {
  const id = customers.length + 1
  customers.push({
    id,
    name: 'New Customer',
    phone: '09xxxxxxxx',
    email: 'new@customer.com',
    status: 'active',
    business_id: '11111111-1111-1111-1111-111111111111',
    created_at: new Date().toISOString()
  })
}

function editCustomer(customer) {
  const name = prompt('Customer Name', customer.name)
  const phone = prompt('Contact Number', customer.phone)
  const email = prompt('Email', customer.email)
  if (name) customer.name = name
  if (phone) customer.phone = phone
  if (email) customer.email = email
}

function deleteCustomer(customer) {
  if (confirm('Delete this customer?')) {
    const index = customers.findIndex(c => c.id === customer.id)
    if (index >= 0) customers.splice(index, 1)
  }
}

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}
</script>
