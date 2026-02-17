<template>
  <div class="bg-white p-4 rounded shadow flex flex-col justify-between">
    <h2 class="text-gray-500">{{ title }}</h2>
    <p class="text-2xl font-bold mt-2">{{ value }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number]
})
</script>
