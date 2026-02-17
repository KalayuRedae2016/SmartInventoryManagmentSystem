<template>
  <Modal :show="open" :title="mode === 'edit' ? 'Edit Product' : 'View Product'" @close="$emit('close')">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input v-model="form.name" :disabled="isView" class="border rounded px-3 py-2" placeholder="Name" />
      <input v-model="form.brand" :disabled="isView" class="border rounded px-3 py-2" placeholder="Brand" />
      <input v-model="form.category" :disabled="isView" class="border rounded px-3 py-2" placeholder="Category" />
      <input v-model="form.unit" :disabled="isView" class="border rounded px-3 py-2" placeholder="Unit" />
      <input v-model="form.price" type="number" :disabled="isView" class="border rounded px-3 py-2" placeholder="Price" />
      <input v-model="form.quantity" type="number" :disabled="isView" class="border rounded px-3 py-2" placeholder="Quantity" />
      <input v-model="form.location" :disabled="isView" class="border rounded px-3 py-2" placeholder="Location" />
    </div>

    <div class="flex justify-end gap-2 mt-4">
      <button class="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300" @click="$emit('close')">Close</button>
      <button v-if="!isView" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" @click="save">Save</button>
    </div>
  </Modal>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import Modal from './Modal.vue'

defineProps({
  open: Boolean,
  product: Object,
  mode: { type: String, default: 'view' } // 'view' or 'edit'
})

const emit = defineEmits(['close', 'save'])

const form = reactive({})

// Update reactive form when product changes
watch(() => product, (p) => {
  Object.assign(form, p || {})
}, { immediate: true })

const isView = computed(() => props.mode === 'view')

function save() {
  emit('save', { ...form })
}
</script>
