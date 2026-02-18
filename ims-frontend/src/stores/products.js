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
      status: 'active',
      quantity: 12
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
      status: 'active',
      quantity: 40
    }
  ]

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    return []
  }

  function normalizeProduct(item) {
    return {
      id: item.id,
      name: item.name || item.productName || '',
      productName: item.productName || item.name || '',
      categoryId: item.categoryId ?? item.category_id ?? null,
      brandId: item.brandId ?? item.brand_id ?? null,
      unitId: item.unitId ?? item.unit_id ?? null,
      sku: item.sku || '',
      barcode: item.barcode || '',
      cost_price: item.defaultCostPrice ?? item.cost_price ?? 0,
      selling_price: item.defaultSellingPrice ?? item.selling_price ?? 0,
      min_stock: item.reorderLevel ?? item.min_stock ?? 0,
      reorderLevel: item.reorderLevel ?? item.min_stock ?? 0,
      status: item.status || (item.isActive === false ? 'inactive' : 'active'),
      quantity: item.quantity ?? 0,
      category: item.category?.name || item.category || '',
      unit: item.unit?.name || item.unit || '',
      brand: item.brand?.name || item.brand || ''
    }
  }

  function mapProductPayload(p) {
    return {
      businessId: 1,
      name: p.name || p.productName || '',
      categoryId: p.categoryId,
      brandId: p.brandId ?? 1,
      unitId: p.unitId,
      sku: p.sku || '',
      barcode: p.barcode || '',
      defaultCostPrice: p.cost_price ?? 0,
      defaultSellingPrice: p.selling_price ?? 0,
      minimumStock: p.reorderLevel ?? p.min_stock ?? 0,
      isActive: (p.status || 'active') === 'active'
    }
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
      if (USE_MOCK) products.value = [...mockData]
      else throw error
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
    const res = await api.post('/products', payload)
    products.value.push(normalizeProduct(getResponseData(res, payload)))
  }

  async function updateProduct(p) {
    if (USE_MOCK) {
      const i = products.value.findIndex(x => x.id === p.id)
      if (i !== -1) products.value[i] = p
      return
    }
    const payload = mapProductPayload(p)
    const res = await api.patch(`/products/${p.id}`, payload)
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
