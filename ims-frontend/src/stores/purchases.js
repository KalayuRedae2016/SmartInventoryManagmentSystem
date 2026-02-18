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
      totalAmount: Number(p.totalAmount ?? p.total_amount ?? 0),
      paidAmount: Number(p.paidAmount ?? p.paid_amount ?? 0),
      dueAmount: Number(p.dueAmount ?? p.due_amount ?? 0),
      warehouseId: p.warehouseId ?? p.warehouse_id ?? null,
      supplierId: p.supplierId ?? p.supplier_id ?? null,
      supplier: p.supplier?.name || p.supplier || p.supplierName || p.supplier_id || '-',
      payment_status:
        p.payment_status ||
        (Number(p.paidAmount ?? 0) >= Number(p.totalAmount ?? 0) ? 'paid' : 'unpaid')
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
      else purchases.value = []
    } finally {
      loading.value = false
    }
  }

  async function addPurchase(payload) {
    if (USE_MOCK) {
      purchases.value.push({ ...payload, id: Date.now() })
      return
    }
    const normalizedPayload = {
      ...payload,
      invoiceNumber: payload.invoiceNumber || `PO-${Date.now().toString().slice(-6)}`,
      paymentMethod: payload.paymentMethod === 'credit' ? 'credit' : 'cash'
    }
    const res = await api.post('/purchases', normalizedPayload)
    purchases.value.push(normalizePurchase(getResponseData(res, normalizedPayload)))
  }

  async function updatePurchase(payload) {
    if (USE_MOCK) {
      const i = purchases.value.findIndex(x => x.id === payload.id)
      if (i !== -1) purchases.value[i] = payload
      return
    }
    const res = await api.patch(`/purchases/${payload.id}`, payload)
    const updated = normalizePurchase(getResponseData(res, payload))
    const i = purchases.value.findIndex(x => x.id === payload.id)
    if (i !== -1) purchases.value[i] = updated
  }

  async function deletePurchase(id) {
    if (!USE_MOCK) await api.delete(`/purchases/${id}`)
    purchases.value = purchases.value.filter(x => x.id !== id)
  }

  async function fetchPurchaseById(id) {
    try {
      const res = await api.get(`/purchases/${id}`)
      return normalizePurchase(getResponseData(res, {}))
    } catch {
      return null
    }
  }

  return {
    purchases,
    loading,
    fetchPurchases,
    fetchPurchaseById,
    addPurchase,
    updatePurchase,
    deletePurchase
  }
})
