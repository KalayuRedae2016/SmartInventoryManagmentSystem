<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { useCategoriesStore } from '@/stores/categories'

const store = useCategoriesStore()

const showModal = ref(false)
const editing = ref(null)

const form = ref({
  name: '',
  description: ''
})

onMounted(store.fetchCategories)

function openAdd() {
  editing.value = null
  form.value = { name: '', description: '' }
  showModal.value = true
}

function openEdit(row) {
  editing.value = row
  form.value = { ...row }
  showModal.value = true
}

function save() {
  editing.value
    ? store.updateCategory(form.value)
    : store.addCategory(form.value)
  showModal.value = false
}

function remove(row) {
  store.deleteCategory(row.id)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold">Categories</h2>
      <button @click="openAdd" class="bg-brand text-white px-4 py-2 rounded">
        + Add Category
      </button>
    </div>

    <DataTable
      :data="store.categories"
      :columns="['name', 'description']"
      canEdit
      canDelete
      @edit="openEdit"
      @delete="remove"
    />

    <Modal
      :show="showModal"
      :title="editing ? 'Edit Category' : 'Add Category'"
      @close="showModal = false"
      @confirm="save"
    >
      <div class="space-y-3">
        <input v-model="form.name" placeholder="Name" class="input" />
        <textarea v-model="form.description" placeholder="Description" class="input"></textarea>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.input {
  width: 100%;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 6px;
}
.bg-brand {
  background: rgb(76,38,131);
}
</style>
