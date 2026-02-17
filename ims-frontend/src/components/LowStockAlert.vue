<template>
  <div v-if="lowStock.length" class="bg-red-50 border border-red-300 p-4 rounded shadow">
    <h3 class="font-bold text-red-700 mb-2">Low Stock Alerts</h3>
    <ul class="text-sm space-y-1">
      <li v-for="product in lowStock" :key="product.id" class="flex justify-between items-center">
        <span>{{ product.name }} ({{ product.quantity }} left)</span>
        <span class="text-xs text-gray-500">{{ product.location }}</span>
      </li>
    </ul>
  </div>
  <div v-else class="text-gray-500 text-sm">
    All products are sufficiently stocked.
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'

defineProps({
  products: {
    type: Array,
    required: true
  },
  threshold: {
    type: Number,
    default: 10 // configurable low stock threshold
  }
})

const lowStock = computed(() => {
  return props.products.filter(p => p.quantity <= props.threshold && p.active)
})
</script>

<style scoped>
/* Optional Tailwind overrides if needed */
</style>
