<template>
  <div class="bg-red-100 text-red-700 p-3 rounded mb-4">
    <h3 class="font-bold">{{ title }}</h3>
    <ul class="mt-2 list-disc ml-5">
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  items: Array
})
</script>
