import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getResponseData } from '@/services/api'

export const usePurchaseItemsStore = defineStore('purchaseItems', () => {
  const items = ref([])
  const loading = ref(false)

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    if (Array.isArray(payload?.data)) return payload.data
    return []
  }

  function normalizeItem(row = {}) {
    return {
      id: row.id,
      purchaseId: row.purchaseId ?? row.purchase_id ?? null,
      businessId: row.businessId ?? row.business_id ?? null,
      warehouseId: row.warehouseId ?? row.warehouse_id ?? null,
      productId: row.productId ?? row.product_id ?? null,
      quantity: Number(row.quantity ?? 0),
      unitPrice: Number(row.unitPrice ?? row.unit_price ?? 0),
      total: Number(row.total ?? 0),
      isActive: typeof row.isActive === 'boolean' ? row.isActive : row.status !== 'inactive',
      status: typeof row.isActive === 'boolean'
        ? (row.isActive ? 'active' : 'inactive')
        : (row.status || 'active'),
      createdAt: row.createdAt || row.created_at || '',
      updatedAt: row.updatedAt || row.updated_at || ''
    }
  }

  async function fetchPurchaseItems(params = {}) {
    loading.value = true
    try {
      const res = await api.get('/purchase-items', { params })
      items.value = asList(getResponseData(res, [])).map(normalizeItem)
    } catch {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  async function addPurchaseItem(payload) {
    const res = await api.post('/purchase-items', payload)
    const item = normalizeItem(getResponseData(res, payload))
    items.value.unshift(item)
  }

  async function updatePurchaseItem(payload) {
    const res = await api.put(`/purchase-items/${payload.id}`, payload)
    const updated = normalizeItem(getResponseData(res, payload))
    const i = items.value.findIndex(x => x.id === payload.id)
    if (i !== -1) items.value[i] = updated
  }

  async function deletePurchaseItem(id) {
    await api.delete(`/purchase-items/${id}`)
    items.value = items.value.filter(x => x.id !== id)
  }

  async function togglePurchaseItemStatus(id, currentIsActive) {
    const nextIsActive = !Boolean(currentIsActive)
    const res = await api.patch(`/purchase-items/${id}/status`, { isActive: nextIsActive })
    const updated = normalizeItem(getResponseData(res, { id, isActive: nextIsActive }))
    const i = items.value.findIndex(x => x.id === id)
    if (i !== -1) items.value[i] = { ...items.value[i], ...updated }
  }

  return {
    items,
    loading,
    fetchPurchaseItems,
    addPurchaseItem,
    updatePurchaseItem,
    deletePurchaseItem,
    togglePurchaseItemStatus
  }
})
