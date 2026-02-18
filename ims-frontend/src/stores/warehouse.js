import { defineStore } from 'pinia'
import { ref } from 'vue'
import { USE_MOCK } from '@/config/env'
import api, { getResponseData } from '@/services/api'

export const useWarehouseStore = defineStore('warehouses', () => {
  const warehouses = ref([])
  const loading = ref(false)

  // Mock data includes stock per product
  const mockData = [
    {
      id: '5a9e0c61-0a7b-4d7e-9a7b-1f2a0f8d6c01',
      business_id: '11111111-1111-1111-1111-111111111111',
      name: 'Main Warehouse',
      location: 'Mekelle',
      manager_id: '2f7b6c19-6a4c-4c4a-9b2a-6c8f2c9a1f01',
      status: 'active',
      created_at: '2026-01-02T09:00:00Z',
      code: 'WH-001',
      isActive: true,
      managerName: 'Admin User',
      phone: '0900000001',
      stock: { 1: 10, 2: 5 } // productId: quantity
    },
    {
      id: '1f4a3d99-7b35-4b66-9a22-0f1d3f5a9c11',
      business_id: '11111111-1111-1111-1111-111111111111',
      name: 'Branch Warehouse',
      location: 'Adigrat',
      manager_id: '2f7b6c19-6a4c-4c4a-9b2a-6c8f2c9a1f01',
      status: 'active',
      created_at: '2026-01-04T10:15:00Z',
      code: 'WH-002',
      isActive: true,
      managerName: 'Admin User',
      phone: '0900000001',
      stock: { 1: 2, 2: 8 }
    }
  ]

  function normalizeWarehouse(item = {}) {
    const isActive = item.isActive ?? item.status === 'active'
    return {
      id: item.id,
      businessId: item.businessId ?? item.business_id ?? 1,
      name: item.name || '',
      code: item.code || '',
      location: item.location || '',
      managerName: item.managerName || '',
      phone: item.phone || '',
      email: item.email || '',
      isActive: Boolean(isActive),
      status: Boolean(isActive) ? 'active' : 'inactive',
      stock: item.stock || {}
    }
  }

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    if (Array.isArray(payload?.data)) return payload.data
    return []
  }

  async function fetchWarehouses() {
    loading.value = true
    try {
      if (USE_MOCK) {
        warehouses.value = mockData.map(normalizeWarehouse)
        return
      }
      const res = await api.get('/warehouses')
      warehouses.value = asList(getResponseData(res, [])).map(normalizeWarehouse)
    } catch (error) {
      if (USE_MOCK) warehouses.value = mockData.map(normalizeWarehouse)
      else throw error
    } finally {
      loading.value = false
    }
  }

  async function addWarehouse(data) {
    if (USE_MOCK) {
      warehouses.value.push(normalizeWarehouse({ ...data, id: Date.now(), stock: {} }))
      return
    }

    const payload = {
      businessId: 1,
      name: data.name || '',
      code: data.code || `WH-${Date.now().toString().slice(-6)}`,
      location: data.location || '',
      managerName: data.managerName || '',
      phone: data.phone || '',
      email: data.email || '',
      isActive: (data.status || 'active') === 'active'
    }

    const res = await api.post('/warehouses', payload)
    warehouses.value.push(normalizeWarehouse(getResponseData(res, payload)))
  }

  async function updateWarehouse(data) {
    const i = warehouses.value.findIndex(w => w.id === data.id)
    if (USE_MOCK) {
      if (i !== -1) warehouses.value[i] = normalizeWarehouse(data)
      return
    }

    const payload = {
      name: data.name,
      location: data.location,
      managerName: data.managerName,
      phone: data.phone,
      email: data.email,
      isActive: (data.status || 'active') === 'active'
    }

    const res = await api.patch(`/warehouses/${data.id}`, payload)
    const updated = normalizeWarehouse(getResponseData(res, { ...data, ...payload }))
    if (i !== -1) warehouses.value[i] = updated
  }

  async function deleteWarehouse(id) {
    if (!USE_MOCK) await api.delete(`/warehouses/${id}`)
    warehouses.value = warehouses.value.filter(w => w.id !== id)
  }

  // ===== Stock management =====
  function increaseStock(warehouseId, productId, qty) {
    const w = warehouses.value.find(w => w.id === warehouseId)
    if (!w) return
    if (!w.stock) w.stock = {}
    w.stock[productId] = (w.stock[productId] || 0) + qty
  }

  function decreaseStock(warehouseId, productId, qty) {
    const w = warehouses.value.find(w => w.id === warehouseId)
    if (!w || !w.stock?.[productId]) return
    w.stock[productId] = Math.max(0, w.stock[productId] - qty)
  }

  function getStock(warehouseId, productId) {
    const w = warehouses.value.find(w => w.id === warehouseId)
    return w?.stock?.[productId] || 0
  }

  return {
    warehouses,
    loading,
    fetchWarehouses,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    increaseStock,
    decreaseStock,
    getStock
  }
})
