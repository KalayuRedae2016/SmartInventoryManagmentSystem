<template>
  <div>
    <h2 class="title">New Invoice</h2>

    <input v-model="customer" placeholder="Customer Name" />
    <input v-model.number="total" type="number" placeholder="Total Amount" />

    <button class="btn" @click="save">
      💾 Save Draft
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSalesStore } from '@/stores/sales'
import { useRouter } from 'vue-router'

const customer = ref('')
const total = ref(0)

const store = useSalesStore()
const router = useRouter()

const save = () => {
  store.createInvoice({
    customer: customer.value,
    total: total.value,
    date: new Date().toISOString().slice(0, 10)
  })
  router.push('/sales')
}
</script>

<style scoped>
.title {
  color: rgb(76, 38, 131);
}

input {
  display: block;
  margin-bottom: 10px;
  padding: 8px;
  width: 300px;
}

.btn {
  background: rgb(76, 38, 131);
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
}
</style>
