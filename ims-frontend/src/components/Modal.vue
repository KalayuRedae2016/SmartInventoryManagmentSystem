<template>
  <div v-if="show" class="fixed inset-0 z-50 bg-black bg-opacity-50 overflow-y-auto p-4">
    <div :class="['bg-white p-6 rounded shadow w-full mx-auto my-4', maxWidth]">
      <!-- Title -->
      <h2 :class="['text-lg font-bold mb-4', isForm ? 'text-gray-700' : 'text-red-600']">{{ title }}</h2>

      <!-- Form / Content -->
      <slot :formData="formData" />

      <!-- Actions -->
      <div class="mt-4 flex justify-end space-x-2">
        <button
          @click="close"
          :class="[
            'px-4 py-2 rounded transition border',
            isForm
              ? 'bg-gray-300 border-gray-300 text-gray-800 hover:bg-gray-400'
              : 'bg-white border-red-300 text-red-600 hover:bg-red-50'
          ]"
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
          class="px-4 py-2 rounded border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition"
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
  maxWidth: { type: String, default: 'max-w-lg' },
  type: { type: String, default: 'form' }, // 'form' or 'confirm'
  closeOnSubmit: { type: Boolean, default: true }
})

const emits = defineEmits(['update:show', 'submit', 'confirm'])

const isForm = props.type === 'form'
const formData = reactive({ ...props.modelValue })

watch(
  () => props.modelValue,
  val => {
  Object.assign(formData, val)
  },
  { deep: true }
)

function close() {
  emits('update:show', false)
}

function submit() {
  emits('submit', { ...formData })
  if (props.closeOnSubmit) close()
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
