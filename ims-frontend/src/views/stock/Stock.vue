<!-- src/views/stock/Stock.vue -->
<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold text-brand">Stock Management</h1>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Total Products in Stock" :value="totalProducts" />
      <StatCard title="Low Stock Items" :value="lowStockCount" />
      <StatCard title="Stock Movements Today" :value="dailyStockMovements" />
    </div>

    <!-- Stock Table -->
    <div class="bg-white p-4 rounded shadow">
      <h2 class="text-xl font-bold mb-2">Current Stock</h2>
      <table class="w-full border-collapse border">
        <thead class="bg-gray-200">
          <tr>
            <th class="border px-4 py-2">Product</th>
            <th class="border px-4 py-2">Warehouse</th>
            <th class="border px-4 py-2">Quantity</th>
            <th class="border px-4 py-2">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in stockList" :key="item.id">
            <td class="border px-4 py-2">{{ item.productName }}</td>
            <td class="border px-4 py-2">{{ item.warehouseName }}</td>
            <td class="border px-4 py-2">{{ item.quantity }}</td>
            <td class="border px-4 py-2">{{ item.updatedAt }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import StatCard from '@/components/StatCard.vue'
import { useStockStore } from '@/stores/stock'

const stockStore = useStockStore()

// Stock Summary
const totalProducts = ref(0)
const lowStockCount = ref(0)
const dailyStockMovements = ref(0)
const stockList = ref([])
onMounted(async () => {
  await stockStore.fetchStock()
  stockList.value = stockStore.stocks
  totalProducts.value = stockList.value.length
  lowStockCount.value = stockList.value.filter(s => s.quantity <= 5).length
  dailyStockMovements.value = stockStore.dailyMovements.length
})
</script>

<style scoped>
.text-brand {
  color: rgb(76, 38, 131);
}
</style>
