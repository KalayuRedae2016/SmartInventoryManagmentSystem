import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getResponseData } from '@/services/api'
import { USE_MOCK } from '@/config/env'

export const useBrandsStore = defineStore('brands', () => {
  const brands = ref([])
  const loading = ref(false)

  const mockData = [
    { id: 1, name: 'Dell', description: 'Brand', country: 'USA' },
    { id: 2, name: 'HP', description: 'Brand', country: 'USA' }
  ]

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    return []
  }

  function normalizeBrand(item) {
    const isActive = item.isActive ?? item.status === 'active'
    return {
      id: item.id,
      businessId: item.businessId ?? item.business_id ?? 1,
      name: item.name || '',
      description: item.description || '',
      country: item.country || '',
      isActive: Boolean(isActive),
      status: Boolean(isActive) ? 'active' : 'inactive',
      createdAt: item.createdAt || item.created_at || '',
      updatedAt: item.updatedAt || item.updated_at || ''
    }
  }

  async function fetchBrands() {
    loading.value = true
    try {
      if (USE_MOCK) {
        brands.value = [...mockData]
        return
      }
      const res = await api.get('/brands')
      brands.value = asList(getResponseData(res, [])).map(normalizeBrand)
    } catch (error) {
      if (USE_MOCK) brands.value = [...mockData]
      else throw error
    } finally {
      loading.value = false
    }
  }

  async function addBrand(b) {
    if (USE_MOCK) {
      brands.value.push({ ...b, id: Date.now() })
      return
    }
    const payload = {
      businessId: 1,
      name: b.name,
      country: b.country || '',
      description: b.description || b.name || '',
      isActive: typeof b.isActive === 'boolean' ? b.isActive : true
    }
    const res = await api.post('/brands', payload)
    brands.value.push(normalizeBrand(getResponseData(res, payload)))
  }

  async function updateBrand(b) {
    if (USE_MOCK) {
      const i = brands.value.findIndex(x => x.id === b.id)
      if (i !== -1) brands.value[i] = b
      return
    }
    const payload = {
      name: b.name,
      country: b.country || '',
      description: b.description || '',
      isActive: typeof b.isActive === 'boolean' ? b.isActive : true
    }
    const res = await api.patch(`/brands/${b.id}`, payload)
    const updated = normalizeBrand(getResponseData(res, b))
    const i = brands.value.findIndex(x => x.id === b.id)
    if (i !== -1) brands.value[i] = updated
  }

  async function deleteBrand(id) {
    if (!USE_MOCK) await api.delete(`/brands/${id}`)
    brands.value = brands.value.filter(b => b.id !== id)
  }

  async function toggleBrandStatus(brand) {
    const nextIsActive = !(brand?.isActive ?? brand?.status === 'active')
    await updateBrand({
      ...brand,
      isActive: nextIsActive
    })
  }

  return { brands, loading, fetchBrands, addBrand, updateBrand, deleteBrand, toggleBrandStatus }
})
