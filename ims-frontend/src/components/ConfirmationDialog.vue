<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm'
  },
  message: {
    type: String,
    default: 'Are you sure?'
  }
})

const emit = defineEmits(['confirm', 'close'])
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
  >
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
      <!-- Title -->
      <h2 class="text-lg font-semibold text-gray-800 mb-3">
        {{ title }}
      </h2>

      <!-- Message -->
      <p class="text-gray-600 mb-6">
        {{ message }}
      </p>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button
          class="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100"
          @click="emit('close')"
        >
          Cancel
        </button>

        <button
          class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          @click="emit('confirm')"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>
