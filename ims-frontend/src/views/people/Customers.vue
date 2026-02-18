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
import { onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { useCustomersStore } from '@/stores/customers'

const store = useCustomersStore()
const customers = store.customers

onMounted(() => {
  store.fetchCustomers()
})

async function addCustomer() {
  await store.addCustomer({
    code: `CUS-${Date.now().toString().slice(-6)}`,
    name: 'New Customer',
    phone: '09xxxxxxxx',
    email: 'new@customer.com'
  })
}

async function editCustomer(customer) {
  const name = prompt('Customer Name', customer.name)
  const phone = prompt('Contact Number', customer.phone)
  const email = prompt('Email', customer.email)
  await store.updateCustomer({
    ...customer,
    name: name || customer.name,
    phone: phone || customer.phone,
    email: email || customer.email
  })
}

async function deleteCustomer(customer) {
  if (confirm('Delete this customer?')) {
    await store.deleteCustomer(customer.id)
  }
}

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}
</script>
