<template>
  <div v-if="purchase" class="space-y-2">
    <h2 class="title">Purchase #{{ purchase.id }}</h2>
    <p><b>Supplier:</b> {{ purchase.supplier?.name || purchase.supplier || '-' }}</p>
    <p><b>Warehouse:</b> {{ purchase.warehouse?.name || '-' }}</p>
    <p><b>Total:</b> {{ purchase.totalAmount }}</p>
    <p><b>Paid:</b> {{ purchase.paidAmount }}</p>
    <p><b>Due:</b> {{ purchase.dueAmount }}</p>
    <p><b>Status:</b> {{ purchase.status }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePurchasesStore } from '@/stores/purchases'

const route = useRoute()
const store = usePurchasesStore()
const purchase = ref(null)

onMounted(async () => {
  purchase.value = await store.fetchPurchaseById(route.params.id)
})
</script>

<style scoped>
.title {
  color: rgb(76, 38, 131);
}
</style>
