<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">Inventory</h1>

    <div class="bg-white rounded shadow overflow-x-auto">
      <table class="min-w-full border-collapse border text-sm">
        <thead class="bg-gray-200">
          <tr>
            <th class="border px-2 py-2 text-left text-xs md:text-sm md:px-4">Product Name</th>
            <th class="border px-2 py-2 text-left text-xs md:text-sm md:px-4">SKU</th>
            <th class="border px-2 py-2 text-left text-xs md:text-sm md:px-4">Category</th>
            <th class="border px-2 py-2 text-left text-xs md:text-sm md:px-4">Quantity</th>
            <th class="border px-2 py-2 text-left text-xs md:text-sm md:px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inventory" :key="item.id">
            <td class="border px-2 py-2 text-xs md:text-sm md:px-4">{{ item.name }}</td>
            <td class="border px-2 py-2 text-xs md:text-sm md:px-4">{{ item.sku }}</td>
            <td class="border px-2 py-2 text-xs md:text-sm md:px-4">{{ item.category }}</td>
            <td class="border px-2 py-2 text-xs md:text-sm md:px-4">{{ item.quantity }}</td>
            <td class="border px-2 py-2 text-xs md:text-sm md:px-4">
              <span
                :class="item.quantity <= item.lowStockThreshold ? 'text-red-600 font-bold' : 'text-green-600'"
              >
                {{ item.quantity <= item.lowStockThreshold ? 'Low Stock' : 'In Stock' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const inventory = ref([
  { id: 1, name: 'Product A', sku: 'A001', category: 'Electronics', quantity: 12, lowStockThreshold: 5 },
  { id: 2, name: 'Product B', sku: 'B002', category: 'Electronics', quantity: 4, lowStockThreshold: 5 },
  { id: 3, name: 'Product C', sku: 'C003', category: 'Furniture', quantity: 20, lowStockThreshold: 10 },
  { id: 4, name: 'Product D', sku: 'D004', category: 'Stationery', quantity: 2, lowStockThreshold: 5 },
  { id: 5, name: 'Product E', sku: 'E005', category: 'Stationery', quantity: 15, lowStockThreshold: 5 }
])
</script>

<style scoped>
</style>
