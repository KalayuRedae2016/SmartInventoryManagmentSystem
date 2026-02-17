<template>
  <div v-if="show" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
    <div class="bg-white p-6 rounded shadow w-full max-w-lg">
      <!-- Title -->
      <h2 class="text-lg font-bold mb-4 text-gray-700">{{ title }}</h2>

      <!-- Form / Content -->
      <slot :formData="formData" />

      <!-- Actions -->
      <div class="mt-4 flex justify-end space-x-2">
        <button
          @click="close"
          class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
        >
          Cancel
        </button>

        <button
          v-if="isForm"
          @click="submit"
          class="px-4 py-2 bg-brand text-white rounded hover:bg-purple-700 transition"
        >
          Save
        </button>

        <button
          v-else
          @click="confirm"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: 'Modal' },
  modelValue: { type: Object, default: () => ({}) },
  type: { type: String, default: 'form' } // 'form' or 'confirm'
})

const emits = defineEmits(['update:show', 'submit', 'confirm'])

const isForm = props.type === 'form'
const formData = reactive({ ...props.modelValue })

watch(() => props.modelValue, val => {
  Object.assign(formData, val)
})

function close() {
  emits('update:show', false)
}

function submit() {
  emits('submit', { ...formData })
  close()
}

function confirm() {
  emits('confirm')
  close()
}
</script>

<style scoped>
.bg-brand {
  background-color: rgb(76, 38, 131);
}
</style>
