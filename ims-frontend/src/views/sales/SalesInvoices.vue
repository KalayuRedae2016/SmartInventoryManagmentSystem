<template>
  <div>
    <h1 class="text-2xl font-bold text-brand mb-4">Sale Invoices</h1>
    <table class="w-full border-collapse border">
      <thead class="bg-gray-200">
        <tr>
          <th class="border px-4 py-2">Invoice ID</th>
          <th class="border px-4 py-2">Customer</th>
          <th class="border px-4 py-2">Total</th>
          <th class="border px-4 py-2">Paid</th>
          <th class="border px-4 py-2">Status</th>
          <th class="border px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="invoice in invoices" :key="invoice.id">
          <td class="border px-4 py-2">{{ invoice.id }}</td>
          <td class="border px-4 py-2">{{ invoice.customer }}</td>
          <td class="border px-4 py-2">{{ invoice.totalAmount }}</td>
          <td class="border px-4 py-2">{{ invoice.paidAmount }}</td>
          <td class="border px-4 py-2">{{ invoice.status }}</td>
          <td class="border px-4 py-2">
            <RouterLink :to="`/sales/invoice/${invoice.id}`" class="text-blue-600 underline">View</RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSalesStore } from '@/stores/sales'

const store = useSalesStore()
const invoices = computed(() => store.sales)

onMounted(() => {
  store.fetchSales()
})
</script>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
</style>
