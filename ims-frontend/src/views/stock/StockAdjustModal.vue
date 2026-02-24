<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  >
    <div class="bg-white w-full max-w-lg p-6 rounded space-y-4">
      <h2 class="text-lg font-semibold">New Stock Adjustment</h2>

      <select v-model.number="form.warehouseId" class="input">
        <option disabled :value="null">Select Warehouse</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.id">
          {{ w.name }}
        </option>
      </select>
      <select v-model.number="form.productId" class="input">
        <option disabled :value="null">Select Product</option>
        <option v-for="p in products" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>
      <select v-model="form.adjustmentType" class="input">
        <option value="addition">addition</option>
        <option value="subtraction">subtraction</option>
        <option value="correction">correction</option>
        <option value="damage">damage</option>
      </select>
      <input v-model.number="form.quantity" type="number" min="1" class="input" placeholder="Quantity" />
      <textarea v-model="form.note" class="input" placeholder="Note / Reason"></textarea>

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
  warehouses: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:show', 'submit'])

const form = ref({
  warehouseId: null,
  productId: null,
  adjustmentType: 'addition',
  quantity: 1,
  note: ''
})

watch(
  () => props.show,
  (val) => {
    if (val) {
      form.value = { warehouseId: null, productId: null, adjustmentType: 'addition', quantity: 1, note: '' }
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
