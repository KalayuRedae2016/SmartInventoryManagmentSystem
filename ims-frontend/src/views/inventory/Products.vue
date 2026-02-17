<template>
  <div class="space-y-4">
    <div class="flex items-end justify-between border-b pb-3 gap-3">
      <h1 class="text-2xl font-bold text-brand">Products</h1>

      <!-- Products Submenu -->
      <div class="flex gap-2">
        <RouterLink to="/categories" class="tab">Categories</RouterLink>
        <RouterLink to="/brands" class="tab">Brands</RouterLink>
        <RouterLink to="/units" class="tab">Units</RouterLink>
      </div>
    </div>

    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex flex-col gap-2">
        <div class="text-sm text-gray-500">Filter By</div>
        <div v-for="(f, idx) in filters" :key="f.id" class="filter-row">
          <select v-model="f.field" class="filter-input">
            <option value="">Select Field</option>
            <option v-for="col in columns" :key="col" :value="col">
              {{ col }}
            </option>
          </select>
          <select v-model="f.value" class="filter-input" :disabled="!f.field">
            <option value="">All</option>
            <option v-for="val in fieldValuesMap[f.field] || []" :key="val" :value="val">
              {{ val }}
            </option>
          </select>
          <button class="filter-remove" @click="removeFilter(idx)" :disabled="filters.length === 1">
            Remove
          </button>
        </div>
        <button class="filter-add" @click="addFilter">Add Filter</button>
      </div>

      <button
        @click="openAddModal"
        class="bg-brand text-white px-3 py-1 rounded hover:bg-purple-700 transition"
      >
        Add Product
      </button>
    </div>

    <!-- DataTable -->
    <DataTable
      :data="filteredProducts"
      :columns="columns"
      :canEdit="true"
      :canDelete="true"
      @edit="openEditModal"
      @delete="openConfirmDelete"
      @export="exportData"
    />

    <!-- Add/Edit Modal -->
    <Modal
      v-model:show="modalVisible"
      :title="editItem ? 'Edit Product' : 'Add Product'"
      :modelValue="editItem"
      type="form"
      @submit="saveProduct"
    >
      <template #default="{ formData }">
        <div class="space-y-2">
          <input v-model="formData.name" placeholder="Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.sku" placeholder="SKU" class="w-full border px-2 py-1 rounded" />
          <select v-model="formData.category" class="w-full border px-2 py-1 rounded">
            <option value="" disabled>Select category</option>
            <option v-if="!categories.length" value="" disabled>No categories found</option>
            <option v-for="c in categories" :key="c.id" :value="c.name">
              {{ c.name }}
            </option>
          </select>
          <select v-model="formData.unit" class="w-full border px-2 py-1 rounded">
            <option value="" disabled>Select unit</option>
            <option v-if="!units.length" value="" disabled>No units found</option>
            <option v-for="u in units" :key="u.id" :value="u.symbol || u.name">
              {{ u.name }}<span v-if="u.symbol"> ({{ u.symbol }})</span>
            </option>
          </select>
          <input type="number" v-model.number="formData.cost_price" placeholder="Cost Price" class="w-full border px-2 py-1 rounded" />
          <input type="number" v-model.number="formData.selling_price" placeholder="Selling Price" class="w-full border px-2 py-1 rounded" />
          <input type="number" v-model.number="formData.min_stock" placeholder="Min Stock" class="w-full border px-2 py-1 rounded" />
          <input type="number" v-model.number="formData.quantity" placeholder="Quantity" class="w-full border px-2 py-1 rounded" />
          <select v-model="formData.status" class="w-full border px-2 py-1 rounded">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation -->
    <Modal
      v-model:show="confirmVisible"
      title="Are you sure you want to delete this product?"
      type="confirm"
      @confirm="deleteProduct"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { useProductsStore } from '@/stores/products'
import { useCategoriesStore } from '@/stores/categories'
import { useUnitsStore } from '@/stores/units'

const store = useProductsStore()
const products = store.products
const categoriesStore = useCategoriesStore()
const unitsStore = useUnitsStore()

const categories = computed(() => categoriesStore.categories)
const units = computed(() => unitsStore.units)

onMounted(() => {
  store.fetchProducts()
  categoriesStore.fetchCategories()
  unitsStore.fetchUnits()
})

const columns = ['id', 'name', 'sku', 'category', 'unit', 'cost_price', 'selling_price', 'min_stock', 'quantity', 'status']

// Filters (multi-field)
const filters = ref([
  { id: 1, field: '', value: '' }
])

function addFilter() {
  filters.value.push({ id: Date.now(), field: '', value: '' })
}

function removeFilter(index) {
  if (filters.value.length === 1) return
  filters.value.splice(index, 1)
}

const fieldValuesMap = computed(() => {
  const map = {}
  for (const col of columns) {
    const values = new Set(products.map(p => String(p[col] ?? '')))
    map[col] = Array.from(values).filter(v => v !== '').sort()
  }
  return map
})

const filteredProducts = computed(() => {
  return products.filter(p => {
    return filters.value.every(f => {
      if (!f.field || !f.value) return true
      return String(p[f.field] ?? '') === f.value
    })
  })
})

// Modal state
const modalVisible = ref(false)
const confirmVisible = ref(false)
const editItem = reactive({})

// Selected row for deletion
let rowToDelete = null

// Open modals
function openAddModal() {
  Object.assign(editItem, {
    id: products.length + 1,
    name: '',
    sku: '',
    category: categories.value[0]?.name || '',
    unit: units.value[0]?.symbol || units.value[0]?.name || '',
    cost_price: 0,
    selling_price: 0,
    min_stock: 0,
    quantity: 0,
    status: 'active',
    business_id: '11111111-1111-1111-1111-111111111111',
    created_at: new Date().toISOString()
  })
  modalVisible.value = true
}

function openEditModal(row) {
  Object.assign(editItem, row)
  modalVisible.value = true
}

function openConfirmDelete(row) {
  rowToDelete = row
  confirmVisible.value = true
}

// Actions
function saveProduct(product) {
  const index = products.findIndex(p => p.id === product.id)
  if (index >= 0) {
    store.updateProduct(product)
  } else {
    store.addProduct(product)
  }
}

function deleteProduct() {
  if (rowToDelete) {
    store.deleteProduct(rowToDelete.id)
    rowToDelete = null
  }
}

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}
</script>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
.tab {
  padding: 6px 12px;
  border-radius: 6px;
  background: #e5e7eb;
  font-weight: 500;
}
.router-link-active {
  background: rgb(76, 38, 131);
  color: white;
}
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-label {
  font-size: 12px;
  color: #6b7280;
}
.filter-input {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 8px;
  background: #fff;
  font-size: 14px;
  min-width: 160px;
}
.filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.filter-add {
  align-self: flex-start;
  font-size: 12px;
  color: rgb(76, 38, 131);
  font-weight: 600;
}
.filter-remove {
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}
</style>
