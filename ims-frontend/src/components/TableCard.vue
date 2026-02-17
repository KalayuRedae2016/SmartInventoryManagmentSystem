<template>
  <div class="bg-white rounded shadow p-4">
    <h3 class="font-bold mb-3" :style="{ color: color }">{{ title }}</h3>
    <table class="w-full table-auto border-collapse">
      <thead>
        <tr>
          <th v-for="header in headers" :key="header" class="border p-2 text-left">{{ header }}</th>
          <th class="border p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td v-for="key in keys" :key="key" class="border p-2">{{ row[key] }}</td>
          <td class="border p-2 space-x-2">
            <button @click="$emit('edit', row)" class="px-2 py-1 rounded text-white" :style="{ backgroundColor: color }">Edit</button>
            <button @click="$emit('delete', row)" class="px-2 py-1 rounded bg-red-600 text-white">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <button @click="$emit('add')" class="mt-3 px-3 py-2 rounded text-white" :style="{ backgroundColor: color }">Add New</button>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  headers: Array,
  keys: Array,
  rows: Array,
  color: { type: String, default: 'rgb(76,38,131)' }
})
</script>
