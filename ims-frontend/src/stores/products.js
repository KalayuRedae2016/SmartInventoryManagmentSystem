import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getResponseData } from '@/services/api'
import { USE_MOCK } from '@/config/env'

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const loading = ref(false)

  const mockData = [
    {
      id: '9d9f8a12-0f4d-4f2f-9f8b-7a5a2c1b3d01',
      name: 'Laptop',
      sku: 'LP-01',
      category: 'Electronics',
      unit: 'pcs',
      cost_price: 700,
      selling_price: 950,
      min_stock: 5,
      status: 'active'
    },
    {
      id: 'a1b2c3d4-5678-4e9a-8b3c-2d1e0f9a8b02',
      name: 'Mouse',
      sku: 'MS-02',
      category: 'Accessories',
      unit: 'pcs',
      cost_price: 8,
      selling_price: 15,
      min_stock: 10,
      status: 'active'
    }
  ]

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    return []
  }

  function normalizeProduct(item) {
    const isActive = item.isActive ?? item.status !== 'inactive'
    return {
      id: item.id,
      businessId: item.businessId ?? item.business_id ?? 1,
      name: item.name || item.productName || '',
      productName: item.productName || item.name || '',
      partNumber: item.partNumber || item.part_number || '',
      serialTracking: Boolean(item.serialTracking ?? item.serial_tracking ?? false),
      categoryId: item.categoryId ?? item.category_id ?? null,
      brandId: item.brandId ?? item.brand_id ?? null,
      unitId: item.unitId ?? item.unit_id ?? null,
      sku: item.sku || '',
      barcode: item.barcode || '',
      defaultCostPrice: item.defaultCostPrice ?? item.cost_price ?? 0,
      defaultSellingPrice: item.defaultSellingPrice ?? item.selling_price ?? 0,
      cost_price: item.defaultCostPrice ?? item.cost_price ?? 0,
      selling_price: item.defaultSellingPrice ?? item.selling_price ?? 0,
      minimumStock: item.minimumStock ?? item.reorderLevel ?? item.min_stock ?? 0,
      min_stock: item.minimumStock ?? item.reorderLevel ?? item.min_stock ?? 0,
      reorderLevel: item.reorderLevel ?? item.min_stock ?? 0,
      preferredCostMethod: item.preferredCostMethod || 'AVERAGE',
      images: Array.isArray(item.images) ? item.images : [],
      isActive: Boolean(isActive),
      status: Boolean(isActive) ? 'active' : 'inactive',
      category: item.category?.name || item.category || '',
      unit: item.unit?.name || item.unit || '',
      brand: item.brand?.name || item.brand || '',
      createdAt: item.createdAt || item.created_at || '',
      updatedAt: item.updatedAt || item.updated_at || ''
    }
  }

  function mapProductPayload(p) {
    return {
      businessId: p.businessId ?? 1,
      name: p.name || p.productName || '',
      partNumber: p.partNumber || '',
      serialTracking: Boolean(p.serialTracking),
      categoryId: p.categoryId,
      brandId: p.brandId ?? 1,
      unitId: p.unitId,
      sku: p.sku || '',
      barcode: p.barcode || '',
      defaultCostPrice: p.defaultCostPrice ?? p.cost_price ?? 0,
      defaultSellingPrice: p.defaultSellingPrice ?? p.selling_price ?? 0,
      minimumStock: p.minimumStock ?? p.reorderLevel ?? p.min_stock ?? 0,
      preferredCostMethod: p.preferredCostMethod || 'AVERAGE',
      isActive: typeof p.isActive === 'boolean' ? p.isActive : (p.status || 'active') === 'active'
    }
  }

  function toFormData(payload = {}, imageFiles = []) {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (typeof value === 'boolean') {
        formData.append(key, String(value))
        return
      }
      formData.append(key, String(value))
    })
    if (Array.isArray(imageFiles)) {
      imageFiles.forEach(file => {
        if (file instanceof File) formData.append('images', file)
      })
    }
    return formData
  }

  async function fetchProducts(params = {}) {
    loading.value = true
    try {
      if (USE_MOCK) {
        products.value = [...mockData]
        return
      }
      const res = await api.get('/products', { params })
      products.value = asList(getResponseData(res, [])).map(normalizeProduct)
    } catch (error) {
      if (USE_MOCK) {
        products.value = [...mockData]
      } else if (error?.response?.status === 404) {
        // Backend may return 404 when there are no rows; keep UI usable.
        products.value = []
      } else {
        throw error
      }
    } finally {
      loading.value = false
    }
  }

  async function addProduct(p) {
    if (USE_MOCK) {
      products.value.push({ ...p, id: Date.now() })
      return
    }
    const payload = mapProductPayload(p)
    const imageFiles = Array.isArray(p.imagesFiles) ? p.imagesFiles : []
    const res = imageFiles.length
      ? await api.post('/products', toFormData(payload, imageFiles), {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      : await api.post('/products', payload)
    products.value.push(normalizeProduct(getResponseData(res, payload)))
  }

  async function updateProduct(p) {
    if (USE_MOCK) {
      const i = products.value.findIndex(x => x.id === p.id)
      if (i !== -1) products.value[i] = p
      return
    }
    const payload = mapProductPayload(p)
    const imageFiles = Array.isArray(p.imagesFiles) ? p.imagesFiles : []
    const res = imageFiles.length
      ? await api.patch(`/products/${p.id}`, toFormData(payload, imageFiles), {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      : await api.patch(`/products/${p.id}`, payload)
    const updated = normalizeProduct(getResponseData(res, { ...p, ...payload }))
    const i = products.value.findIndex(x => x.id === p.id)
    if (i !== -1) products.value[i] = updated
  }

  async function deleteProduct(id) {
    if (!USE_MOCK) await api.delete(`/products/${id}`)
    products.value = products.value.filter(p => p.id !== id)
  }

  return { products, loading, fetchProducts, addProduct, updateProduct, deleteProduct }
})
