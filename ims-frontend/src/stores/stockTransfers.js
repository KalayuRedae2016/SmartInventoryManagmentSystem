import { defineStore } from 'pinia'
import { ref } from 'vue'
import { USE_MOCK } from '@/config/env'
import { useWarehouseStore } from '@/stores/warehouse'
import { useProductsStore } from '@/stores/products'
import api, { getResponseData } from '@/services/api'

export const useStockTransfersStore = defineStore('stockTransfers', () => {
  const transfers = ref([])
  const loading = ref(false)

  const warehouseStore = useWarehouseStore()
  const productStore = useProductsStore()

  // Mock Data
  const mockData = [
    {
      id: 'e1f2a3b4-5c6d-4e7f-8a9b-0c1d2e3f4a01',
      business_id: '11111111-1111-1111-1111-111111111111',
      from_warehouse_id: '5a9e0c61-0a7b-4d7e-9a7b-1f2a0f8d6c01',
      to_warehouse_id: '1f4a3d99-7b35-4b66-9a22-0f1d3f5a9c11',
      status: 'pending',
      requested_by: '2f7b6c19-6a4c-4c4a-9b2a-6c8f2c9a1f01',
      approved_by: null,
      created_at: '2026-01-20T12:00:00Z',
      approved_at: null,
      productId: 1,
      fromWarehouseId: 1,
      toWarehouseId: 2,
      quantity: 5,
      createdBy: 'store_keeper'
    }
  ]

  // =========================
  // Fetch all transfers
  // =========================
  async function fetchTransfers() {
    loading.value = true
    try {
      if (USE_MOCK) {
        transfers.value = [...mockData]
        return
      }
      try {
        const res = await api.get('/stock-transfers')
        const payload = getResponseData(res, [])
        transfers.value = Array.isArray(payload) ? payload : []
      } catch {
        transfers.value = [...mockData]
      }
    } finally {
      loading.value = false
    }
  }

  // =========================
  // Add new transfer
  // =========================
  function addTransfer(t) {
    t.id = Date.now()
    t.status = 'pending'
    transfers.value.push(t)
  }

  // =========================
  // Approve transfer
  // =========================
  function approveTransfer(id) {
    const tIndex = transfers.value.findIndex(t => t.id === id)
    if (tIndex === -1) return

    const t = transfers.value[tIndex]

    // 1️⃣ Update warehouse stock balances
    const fromWh = warehouseStore.warehouses.find(w => w.id === t.fromWarehouseId)
    const toWh = warehouseStore.warehouses.find(w => w.id === t.toWarehouseId)
    const product = productStore.products.find(p => p.id === t.productId)

    if (!fromWh || !toWh || !product) return

    // Deduct from source warehouse
    if (!fromWh.stock) fromWh.stock = {}
    fromWh.stock[t.productId] = (fromWh.stock[t.productId] || 0) - t.quantity

    // Add to destination warehouse
    if (!toWh.stock) toWh.stock = {}
    toWh.stock[t.productId] = (toWh.stock[t.productId] || 0) + t.quantity

    // 2️⃣ Mark transfer as approved
    transfers.value[tIndex].status = 'approved'
  }

  // =========================
  // Reject transfer
  // =========================
  function rejectTransfer(id) {
    const tIndex = transfers.value.findIndex(t => t.id === id)
    if (tIndex === -1) return

    transfers.value[tIndex].status = 'rejected'
  }

  // =========================
  // Update transfer (edit)
  // =========================
  function updateTransfer(t) {
    const i = transfers.value.findIndex(x => x.id === t.id)
    if (i !== -1) transfers.value[i] = t
  }

  // =========================
  // Delete transfer
  // =========================
  function deleteTransfer(id) {
    transfers.value = transfers.value.filter(t => t.id !== id)
  }

  return {
    transfers,
    loading,
    fetchTransfers,
    addTransfer,
    updateTransfer,
    deleteTransfer,
    approveTransfer,
    rejectTransfer
  }
})
