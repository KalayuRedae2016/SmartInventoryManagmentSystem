import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getResponseData } from '@/services/api'
import { USE_MOCK } from '@/config/env'

export const usePurchasesStore = defineStore('purchases', () => {
  const purchases = ref([])
  const loading = ref(false)

  const mockData = [
    {
      id: 'c3b1f2e4-7b6a-4a0f-9b2c-1d3e5f6a7b01',
      supplier_id: '7c1f27f2-9e5f-4f47-9b3b-1f0a5b9c5e21',
      invoiceNumber: 'PO-0001',
      purchaseDate: '2026-01-15',
      totalAmount: 5000,
      status: 'pending',
      supplier: 'ABC Supplier',
      payment_status: 'unpaid'
    }
  ]

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    return []
  }

  function normalizePurchase(p) {
    return {
      ...p,
      supplier: p.supplier || p.supplierName || p.supplier_id || '-',
      payment_status: p.payment_status || 'unpaid'
    }
  }

  async function fetchPurchases() {
    loading.value = true
    try {
      if (USE_MOCK) {
        purchases.value = [...mockData]
        return
      }
      const res = await api.get('/purchases')
      purchases.value = asList(getResponseData(res, [])).map(normalizePurchase)
    } catch (error) {
      if (USE_MOCK) purchases.value = [...mockData]
      else throw error
    } finally {
      loading.value = false
    }
  }

  async function addPurchase(payload) {
    if (USE_MOCK) {
      purchases.value.push({ ...payload, id: Date.now() })
      return
    }
    const res = await api.post('/purchases', payload)
    purchases.value.push(normalizePurchase(getResponseData(res, payload)))
  }

  async function updatePurchase(payload) {
    if (USE_MOCK) {
      const i = purchases.value.findIndex(x => x.id === payload.id)
      if (i !== -1) purchases.value[i] = payload
      return
    }
    const res = await api.put(`/purchases/${payload.id}`, payload)
    const updated = normalizePurchase(getResponseData(res, payload))
    const i = purchases.value.findIndex(x => x.id === payload.id)
    if (i !== -1) purchases.value[i] = updated
  }

  async function deletePurchase(id) {
    if (!USE_MOCK) await api.delete(`/purchases/${id}`)
    purchases.value = purchases.value.filter(x => x.id !== id)
  }

  return {
    purchases,
    loading,
    fetchPurchases,
    addPurchase,
    updatePurchase,
    deletePurchase
  }
})
