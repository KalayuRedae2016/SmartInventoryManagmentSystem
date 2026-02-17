<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { useUnitsStore } from '@/stores/units'

const store = useUnitsStore()

const showModal = ref(false)
const editing = ref(null)
const form = ref({ name: '', symbol: '' })

onMounted(store.fetchUnits)

function openAdd() {
  editing.value = null
  form.value = { name: '', symbol: '' }
  showModal.value = true
}

function openEdit(row) {
  editing.value = row
  form.value = { ...row }
  showModal.value = true
}

function save() {
  editing.value ? store.updateUnit(form.value) : store.addUnit(form.value)
  showModal.value = false
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between">
      <h2 class="text-2xl font-bold">Units</h2>
      <button @click="openAdd" class="bg-brand text-white px-4 py-2 rounded">
        + Add Unit
      </button>
    </div>

    <DataTable
      :data="store.units"
      :columns="['name', 'symbol']"
      canEdit
      canDelete
      @edit="openEdit"
      @delete="store.deleteUnit"
    />

    <Modal :show="showModal" title="Unit" @close="showModal=false" @confirm="save">
      <div class="space-y-3">
        <input v-model="form.name" placeholder="Unit Name" class="input" />
        <input v-model="form.symbol" placeholder="Symbol" class="input" />
      </div>
    </Modal>
  </div>
</template>
