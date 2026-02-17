<template>
  <div v-if="purchase">
    <h2 class="title">Purchase #{{ purchase.id }}</h2>

    <p><b>Supplier:</b> {{ purchase.supplier }}</p>
    <p><b>Total:</b> {{ purchase.total }} ETB</p>
    <p><b>Status:</b> {{ purchase.status }}</p>

    <button v-if="purchase.status === 'approved'" @click="store.receivePurchase(purchase.id)">
      📥 Receive Items
    </button>

    <button v-if="purchase.status === 'received'" @click="store.markPaid(purchase.id)">
      💵 Mark as Paid
    </button>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { usePurchaseStore } from '@/stores/purchase'

const route = useRoute()
const store = usePurchaseStore()

const purchase = store.purchases.find(
  p => p.id === Number(route.params.id)
)
</script>

<style scoped>
.title {
  color: rgb(76, 38, 131);
}
button {
  margin-right: 10px;
  background: rgb(76, 38, 131);
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
}
</style>
