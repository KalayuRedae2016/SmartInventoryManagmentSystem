<template>
  <DashboardLayout>
    <h2>Products</h2>

    <button @click="addProduct">Add Product</button>

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in store.products" :key="p.name">
          <td>{{ p.name }}</td>
          <td>{{ p.qty }}</td>
        </tr>
      </tbody>
    </table>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useInventoryStore } from '../stores/inventory'

const store = useInventoryStore()

function addProduct() {
  const name = prompt('Product Name:')
  const qty = parseInt(prompt('Quantity:'), 10) || 0
  if (name) store.addProduct({ name, qty })
}
</script>
