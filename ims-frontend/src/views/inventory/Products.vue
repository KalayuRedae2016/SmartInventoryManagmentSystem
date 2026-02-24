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
      :canEdit="false"
      :canDelete="false"
      @export="exportData"
    >
      <template #rowActions="{ row }">
        <button class="icon-btn icon-view" title="View" @click="openViewModal(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5c5.5 0 9.5 4.3 10.8 6.1a1.5 1.5 0 0 1 0 1.8C21.5 14.7 17.5 19 12 19S2.5 14.7 1.2 12.9a1.5 1.5 0 0 1 0-1.8C2.5 9.3 6.5 5 12 5Zm0 2C8 7 4.8 10 3.3 12 4.8 14 8 17 12 17s7.2-3 8.7-5C19.2 10 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
          </svg>
        </button>
        <button class="icon-btn icon-edit" title="Edit" @click="openEditModal(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17.3V21h3.7l10.9-10.9-3.7-3.7L3 17.3Zm18.7-11a1 1 0 0 0 0-1.4L19.1 2.3a1 1 0 0 0-1.4 0l-1.9 1.9 3.7 3.7 2.2-1.6Z" />
          </svg>
        </button>
        <button class="icon-btn icon-delete" title="Delete" @click="openConfirmDelete(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
          </svg>
        </button>
      </template>
    </DataTable>

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
          <input v-model="formData.name" placeholder="Name (STRING)" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.sku" placeholder="SKU (STRING)" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.partNumber" placeholder="Part Number (STRING)" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.barcode" placeholder="Barcode (STRING)" class="w-full border px-2 py-1 rounded" />

          <select v-model="formData.categoryId" class="w-full border px-2 py-1 rounded">
            <option :value="null" disabled>Select category</option>
            <option v-if="!categories.length" value="" disabled>No categories found</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
          <select v-model="formData.brandId" class="w-full border px-2 py-1 rounded">
            <option :value="null" disabled>Select brand</option>
            <option v-if="!brands.length" value="" disabled>No brands found</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">
              {{ b.name }}
            </option>
          </select>
          <select v-model="formData.unitId" class="w-full border px-2 py-1 rounded">
            <option :value="null" disabled>Select unit</option>
            <option v-if="!units.length" value="" disabled>No units found</option>
            <option v-for="u in units" :key="u.id" :value="u.id">
              {{ u.name }}<span v-if="u.symbol"> ({{ u.symbol }})</span>
            </option>
          </select>

          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="formData.serialTracking" type="checkbox" />
            <span>Serial Tracking (BOOLEAN)</span>
          </label>

          <input type="number" v-model.number="formData.minimumStock" placeholder="Minimum Stock (INT)" class="w-full border px-2 py-1 rounded" />
          <select v-model="formData.preferredCostMethod" class="w-full border px-2 py-1 rounded">
            <option value="FIFO">FIFO</option>
            <option value="LIFO">LIFO</option>
            <option value="AVERAGE">AVERAGE</option>
          </select>

          <input type="number" step="0.01" v-model.number="formData.defaultCostPrice" placeholder="Default Cost Price (FLOAT)" class="w-full border px-2 py-1 rounded" />
          <input type="number" step="0.01" v-model.number="formData.defaultSellingPrice" placeholder="Default Selling Price (FLOAT)" class="w-full border px-2 py-1 rounded" />

          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="formData.isActive" type="checkbox" />
            <span>isActive (BOOLEAN)</span>
          </label>

          <input type="file" multiple accept="image/*" class="w-full border px-2 py-1 rounded" @change="onProductImagesSelected($event, formData)" />
          <div v-if="Array.isArray(formData.imagePreviews) && formData.imagePreviews.length" class="flex flex-wrap gap-2">
            <img v-for="(src, i) in formData.imagePreviews" :key="`${src}-${i}`" :src="src" alt="" class="w-16 h-16 object-cover rounded border" />
          </div>
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

    <!-- View Product Modal -->
    <div v-if="viewModalVisible" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded shadow w-full max-w-lg">
        <div class="px-4 py-3 border-b">
          <h3 class="text-lg font-semibold text-gray-800">Product Details</h3>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="detail-row"><span class="detail-label">Name</span><span>{{ viewItem.name || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">SKU</span><span>{{ viewItem.sku || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Part Number</span><span>{{ viewItem.partNumber || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Barcode</span><span>{{ viewItem.barcode || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Category ID</span><span>{{ viewItem.categoryId ?? '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Brand ID</span><span>{{ viewItem.brandId ?? '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Unit ID</span><span>{{ viewItem.unitId ?? '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Serial Tracking</span><span>{{ String(Boolean(viewItem.serialTracking)) }}</span></div>
          <div class="detail-row"><span class="detail-label">Minimum Stock</span><span>{{ viewItem.minimumStock ?? viewItem.min_stock ?? '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Preferred Cost Method</span><span>{{ viewItem.preferredCostMethod || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Default Cost Price</span><span>{{ viewItem.defaultCostPrice ?? viewItem.cost_price ?? '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Default Selling Price</span><span>{{ viewItem.defaultSellingPrice ?? viewItem.selling_price ?? '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">isActive</span><span>{{ String(viewItem.isActive ?? (viewItem.status !== 'inactive')) }}</span></div>
          <div class="detail-row sm:col-span-2">
            <span class="detail-label">Images (JSON)</span>
            <div v-if="Array.isArray(viewItem.images) && viewItem.images.length" class="flex flex-wrap gap-2 mt-1">
              <img v-for="(img, idx) in viewItem.images" :key="`${img}-${idx}`" :src="img" alt="" class="w-16 h-16 object-cover rounded border" />
            </div>
            <span v-else>-</span>
          </div>
        </div>
        <div class="px-4 py-3 border-t flex justify-end">
          <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition" @click="closeViewModal">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { useProductsStore } from '@/stores/products'
import { useCategoriesStore } from '@/stores/categories'
import { useUnitsStore } from '@/stores/units'
import { useBrandsStore } from '@/stores/brands'

const store = useProductsStore()
const products = store.products
const categoriesStore = useCategoriesStore()
const unitsStore = useUnitsStore()
const brandsStore = useBrandsStore()

const categories = computed(() => categoriesStore.categories)
const units = computed(() => unitsStore.units)
const brands = computed(() => brandsStore.brands)

onMounted(() => {
  store.fetchProducts()
  categoriesStore.fetchCategories()
  unitsStore.fetchUnits()
  brandsStore.fetchBrands()
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
const viewModalVisible = ref(false)
const editItem = reactive({})
const viewItem = reactive({})

// Selected row for deletion
let rowToDelete = null

// Open modals
function openAddModal() {
  Object.assign(editItem, {
    id: null,
    businessId: 1,
    name: '',
    sku: '',
    partNumber: '',
    barcode: '',
    categoryId: null,
    brandId: null,
    unitId: null,
    serialTracking: false,
    minimumStock: 0,
    preferredCostMethod: 'AVERAGE',
    defaultCostPrice: 0,
    defaultSellingPrice: 0,
    images: [],
    imagesFiles: [],
    imagePreviews: [],
    isActive: true
  })
  modalVisible.value = true
}

function openEditModal(row) {
  Object.assign(editItem, {
    ...row,
    partNumber: row.partNumber || '',
    barcode: row.barcode || '',
    serialTracking: Boolean(row.serialTracking),
    minimumStock: row.minimumStock ?? row.min_stock ?? 0,
    preferredCostMethod: row.preferredCostMethod || 'AVERAGE',
    defaultCostPrice: row.defaultCostPrice ?? row.cost_price ?? 0,
    defaultSellingPrice: row.defaultSellingPrice ?? row.selling_price ?? 0,
    imagesFiles: [],
    imagePreviews: Array.isArray(row.images) ? row.images : [],
    isActive: typeof row.isActive === 'boolean' ? row.isActive : row.status !== 'inactive'
  })
  modalVisible.value = true
}

function openConfirmDelete(row) {
  rowToDelete = row
  confirmVisible.value = true
}

function openViewModal(row) {
  Object.assign(viewItem, row)
  viewModalVisible.value = true
}

function closeViewModal() {
  viewModalVisible.value = false
}

function onProductImagesSelected(event, formData) {
  const files = Array.from(event?.target?.files || []).filter(Boolean)
  formData.imagesFiles = files
  formData.imagePreviews = files.map(file => URL.createObjectURL(file))
}

// Actions
async function saveProduct(product) {
  if (!String(product.name || '').trim()) {
    alert('Name is required.')
    return
  }
  const index = products.findIndex(p => p.id === product.id)
  if (index >= 0) {
    await store.updateProduct(product)
  } else {
    await store.addProduct(product)
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
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  transition: background-color .15s ease, border-color .15s ease;
}
.icon-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.icon-view { color: rgb(76, 38, 131); }
.icon-view:hover { background: #f5f3ff; border-color: #c4b5fd; }
.icon-edit { color: #2563eb; }
.icon-edit:hover { background: #eff6ff; border-color: #93c5fd; }
.icon-delete { color: #dc2626; }
.icon-delete:hover { background: #fef2f2; border-color: #fca5a5; }
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-label {
  font-size: 12px;
  color: #6b7280;
}
</style>


