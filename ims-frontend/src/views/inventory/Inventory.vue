<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Inventory</h1>

    <table class="w-full border-collapse border">
      <thead class="bg-gray-200">
        <tr>
          <th class="border px-4 py-2 text-left">Product Name</th>
          <th class="border px-4 py-2 text-left">SKU</th>
          <th class="border px-4 py-2 text-left">Category</th>
          <th class="border px-4 py-2 text-left">Quantity</th>
          <th class="border px-4 py-2 text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in inventory" :key="item.id">
          <td class="border px-4 py-2">{{ item.name }}</td>
          <td class="border px-4 py-2">{{ item.sku }}</td>
          <td class="border px-4 py-2">{{ item.category }}</td>
          <td class="border px-4 py-2">{{ item.quantity }}</td>
          <td class="border px-4 py-2">
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
table th, table td {
  border: 1px solid #ddd;
  padding: 8px;
}

table th {
  background-color: #f3f3f3;
  font-weight: bold;
}
</style>
