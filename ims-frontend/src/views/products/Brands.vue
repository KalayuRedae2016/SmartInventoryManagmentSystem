<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { useBrandsStore } from '@/stores/brands'

const store = useBrandsStore()

const showModal = ref(false)
const editing = ref(null)
const form = ref({ name: '', country: '' })

onMounted(store.fetchBrands)

function openAdd() {
  editing.value = null
  form.value = { name: '', country: '' }
  showModal.value = true
}

function openEdit(row) {
  editing.value = row
  form.value = { ...row }
  showModal.value = true
}

function save() {
  editing.value ? store.updateBrand(form.value) : store.addBrand(form.value)
  showModal.value = false
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between">
      <h2 class="text-2xl font-bold">Brands</h2>
      <button @click="openAdd" class="bg-brand text-white px-4 py-2 rounded">
        + Add Brand
      </button>
    </div>

    <DataTable
      :data="store.brands"
      :columns="['name', 'country']"
      canEdit
      canDelete
      @edit="openEdit"
      @delete="store.deleteBrand"
    />

    <Modal :show="showModal" title="Brand" @close="showModal=false" @confirm="save">
      <div class="space-y-3">
        <input v-model="form.name" placeholder="Brand Name" class="input" />
        <input v-model="form.country" placeholder="Country" class="input" />
      </div>
    </Modal>
  </div>
</template>
