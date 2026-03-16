<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-brand">Stock Transactions</h1>

    <div class="bg-white shadow rounded overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-200">
          <tr>
            <th class="px-2 py-2 text-xs md:text-sm">Date</th>
            <th class="px-2 py-2 text-xs md:text-sm">Product</th>
            <th class="px-2 py-2 text-xs md:text-sm">Type</th>
            <th class="px-2 py-2 text-xs md:text-sm">Qty</th>
            <th class="px-2 py-2 text-xs md:text-sm">Note</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in stock.transactions" :key="t.id">
            <td class="px-2 py-2 text-xs md:text-sm">{{ t.date }}</td>
            <td class="px-2 py-2 text-xs md:text-sm">{{ t.product }}</td>
            <td class="px-2 py-2 font-bold text-xs md:text-sm">{{ t.type }}</td>
            <td class="px-2 py-2 text-xs md:text-sm">{{ t.quantity }}</td>
            <td class="px-2 py-2 text-xs md:text-sm">{{ t.note }}</td>
          </tr>
        </tbody>
      </table>
    </div>
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
