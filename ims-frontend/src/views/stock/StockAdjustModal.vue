<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  >
    <div class="bg-white w-full max-w-lg p-6 rounded space-y-4">
      <h2 class="text-lg font-semibold">New Stock Adjustment</h2>

      <input v-model="form.product" class="input" placeholder="Product" />
      <select v-model="form.warehouseName" class="input">
        <option disabled value="">Select Warehouse</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.name">
          {{ w.name }}
        </option>
      </select>
      <select v-model="form.type" class="input">
        <option value="addition">addition</option>
        <option value="subtraction">subtraction</option>
      </select>
      <input v-model.number="form.qty" type="number" min="1" class="input" placeholder="Quantity" />
      <textarea v-model="form.reason" class="input" placeholder="Reason"></textarea>

      <div class="flex justify-end gap-2">
        <button class="btn-secondary" @click="close">Cancel</button>
        <button class="btn-primary" @click="submit">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  warehouses: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:show', 'submit'])

const form = ref({
  product: '',
  warehouseName: '',
  type: 'addition',
  qty: 1,
  reason: ''
})

watch(
  () => props.show,
  (val) => {
    if (val) {
      form.value = { product: '', warehouseName: '', type: 'addition', qty: 1, reason: '' }
    }
  }
)

function close() {
  emit('update:show', false)
}

function submit() {
  emit('submit', { ...form.value })
}
</script>

<style scoped>
.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
}
.btn-secondary {
  background: #eee;
  padding: 6px 14px;
  border-radius: 6px;
}
.input {
  width: 100%;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 6px;
}
</style>
