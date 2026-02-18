<template>
  <div v-if="invoice" class="space-y-2">
    <h2 class="title">Invoice #{{ invoice.id }}</h2>
    <p><b>Customer:</b> {{ invoice.customer }}</p>
    <p><b>Total:</b> {{ invoice.totalAmount }}</p>
    <p><b>Paid:</b> {{ invoice.paidAmount }}</p>
    <p><b>Due:</b> {{ invoice.dueAmount }}</p>
    <p><b>Status:</b> {{ invoice.status }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSalesStore } from '@/stores/sales'

const route = useRoute()
const store = useSalesStore()
const invoice = ref(null)

onMounted(async () => {
  invoice.value = await store.fetchSaleById(route.params.id)
})
</script>

<style scoped>
.title {
  color: rgb(76, 38, 131);
}
</style>
