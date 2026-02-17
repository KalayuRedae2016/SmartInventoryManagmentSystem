<template>
  <table class="min-w-full bg-white">
    <thead>
      <tr>
        <th class="px-4 py-2 border">ID</th>
        <th class="px-4 py-2 border">Type</th>
        <th class="px-4 py-2 border">Description</th>
        <th class="px-4 py-2 border">Date</th>
        <th class="px-4 py-2 border">User</th>
        <th class="px-4 py-2 border">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in paginatedItems" :key="item.id">
        <td class="px-4 py-2 border">{{ item.id }}</td>
        <td class="px-4 py-2 border">{{ item.type }}</td>
        <td class="px-4 py-2 border">{{ item.description }}</td>
        <td class="px-4 py-2 border">{{ item.date }}</td>
        <td class="px-4 py-2 border">{{ item.user }}</td>
        <td class="px-4 py-2 border space-x-2">
          <button @click="$emit('action', { action: 'view', item })" class="bg-blue-500 text-white px-2 py-1 rounded">View</button>
          <button @click="$emit('action', { action: 'edit', item })" class="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
          <button @click="$emit('action', { action: 'deactivate', item })" class="bg-gray-500 text-white px-2 py-1 rounded">Deactivate</button>
          <button @click="$emit('action', { action: 'delete', item })" class="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Pagination -->
  <div class="mt-2 flex justify-between items-center">
    <button @click="prevPage" class="px-3 py-1 bg-gray-200 rounded">Previous</button>
    <span>Page {{ currentPage }} / {{ totalPages }}</span>
    <button @click="nextPage" class="px-3 py-1 bg-gray-200 rounded">Next</button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
defineProps({
  items: Array,
  pagination: Object
})
const currentPage = ref(1)
const perPage = 10

const totalPages = computed(() => Math.ceil(props.items.length / perPage))
const paginatedItems = computed(() =>
  props.items.slice((currentPage.value - 1) * perPage, currentPage.value * perPage)
)

function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
function prevPage() { if (currentPage.value > 1) currentPage.value-- }
</script>
