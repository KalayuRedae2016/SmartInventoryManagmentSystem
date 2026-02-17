<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-purple-800">➕ New Purchase</h1>
      <RouterLink
        to="/purchases"
        class="btn-secondary"
      >
        ← Back to Purchases
      </RouterLink>
    </div>

    <!-- Form -->
    <div class="bg-white rounded shadow p-6 space-y-4">
      <div>
        <label class="block font-semibold mb-1">Supplier Name</label>
        <input v-model="purchase.supplier" class="input" placeholder="Enter supplier name" />
      </div>

      <div>
        <label class="block font-semibold mb-1">Items</label>
        <textarea
          v-model="purchase.itemsText"
          class="input"
          placeholder="List items here, comma-separated"
        ></textarea>
      </div>

      <div class="flex justify-end gap-2">
        <RouterLink to="/purchases" class="btn-secondary">Cancel</RouterLink>
        <button class="btn-primary" @click="savePurchase">Save Draft</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePurchasesStore } from '@/stores/purchases'
import { RouterLink, useRouter } from 'vue-router'

const purchasesStore = usePurchasesStore()
const router = useRouter()

const purchase = ref({
  supplier: '',
  itemsText: '',
  items: [],
  status: 'draft',
  payment_status: 'unpaid'
})

function savePurchase() {
  if (!purchase.value.supplier) return

  // Convert comma-separated text to items array
  purchase.value.items = purchase.value.itemsText
    .split(',')
    .map(i => i.trim())
    .filter(Boolean)

  // Add ID and save to store
  const id = Date.now()
  purchasesStore.purchases.push({ ...purchase.value, id })
  router.push('/purchases')
}
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary {
  background: #eee;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
