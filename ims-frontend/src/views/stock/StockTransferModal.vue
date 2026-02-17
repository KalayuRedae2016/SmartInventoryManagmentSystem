<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  >
    <div class="bg-white w-full max-w-lg p-6 rounded space-y-4">
      <h2 class="text-lg font-semibold">New Stock Transfer</h2>

      <select v-model="form.productId" class="input">
        <option disabled value="">Select Product</option>
        <option v-for="p in products" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>

      <select v-model="form.fromWarehouseId" class="input">
        <option disabled value="">From Warehouse</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.id">
          {{ w.name }}
        </option>
      </select>

      <p v-if="form.fromWarehouseId && form.productId" class="text-gray-600 text-sm">
        Available stock: {{ getStock(form.fromWarehouseId, form.productId) }}
      </p>

      <select v-model="form.toWarehouseId" class="input">
        <option disabled value="">To Warehouse</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.id">
          {{ w.name }}
        </option>
      </select>

      <input
        v-model.number="form.quantity"
        type="number"
        min="1"
        class="input"
        placeholder="Quantity"
      />

      <p v-if="errorMessage" class="text-red-600 text-sm">{{ errorMessage }}</p>

      <div class="flex justify-end gap-2">
        <button class="btn-secondary" @click="close">Cancel</button>
        <button
          class="btn-primary"
          @click="submit"
          :disabled="!form.productId || !form.fromWarehouseId || !form.toWarehouseId || form.quantity <= 0"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  products: { type: Array, default: () => [] },
  warehouses: { type: Array, default: () => [] },
  errorMessage: { type: String, default: '' },
  getStock: { type: Function, required: true }
})

const emit = defineEmits(['update:show', 'submit'])

const form = ref({
  productId: '',
  fromWarehouseId: '',
  toWarehouseId: '',
  quantity: 1
})

watch(
  () => props.show,
  (val) => {
    if (val) {
      form.value = {
        productId: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        quantity: 1
      }
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
