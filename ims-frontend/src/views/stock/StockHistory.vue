<template>
  <div>
    <h1 class="text-2xl font-bold mb-4 text-brand">Stock Transactions</h1>

    <table class="w-full bg-white shadow rounded">
      <thead class="bg-gray-200">
        <tr>
          <th class="p-2">Date</th>
          <th class="p-2">Product</th>
          <th class="p-2">Type</th>
          <th class="p-2">Qty</th>
          <th class="p-2">Note</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in stock.transactions" :key="t.id">
          <td class="p-2">{{ t.date }}</td>
          <td class="p-2">{{ t.product }}</td>
          <td class="p-2 font-bold">{{ t.type }}</td>
          <td class="p-2">{{ t.quantity }}</td>
          <td class="p-2">{{ t.note }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useStockStore } from '@/stores/stock'
const stock = useStockStore()

onMounted(async () => {
  await stock.fetchStock()
})
</script>
