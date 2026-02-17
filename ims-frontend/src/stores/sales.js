import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getResponseData } from '@/services/api'
import { USE_MOCK } from '@/config/env'

export const useSalesStore = defineStore('sales', () => {
  const sales = ref([])
  const loading = ref(false)

  const mockData = [
    {
      id: 'd0a1b2c3-4d5e-4f60-9a7b-8c9d0e1f2a01',
      customer_id: '3b1f61a7-2d8a-49a1-8d7e-5b15e2d0e701',
      invoiceNumber: 'SO-0001',
      salesDate: '2026-01-18',
      totalAmount: 3000,
      status: 'pending',
      customer: 'John Doe',
      paymentMethod: 'cash'
    }
  ]

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    return []
  }

  function normalizeSale(s) {
    return {
      ...s,
      customer: s.customer || s.customerName || s.customer_id || '-'
    }
  }

  async function fetchSales() {
    loading.value = true
    try {
      if (USE_MOCK) {
        sales.value = [...mockData]
        return
      }
      const res = await api.get('/sales')
      sales.value = asList(getResponseData(res, [])).map(normalizeSale)
    } catch (error) {
      if (USE_MOCK) sales.value = [...mockData]
      else throw error
    } finally {
      loading.value = false
    }
  }

  async function addSale(payload) {
    if (USE_MOCK) {
      sales.value.push({ ...payload, id: Date.now() })
      return
    }
    const res = await api.post('/sales', payload)
    sales.value.push(normalizeSale(getResponseData(res, payload)))
  }

  async function updateSale(payload) {
    if (USE_MOCK) {
      const i = sales.value.findIndex(x => x.id === payload.id)
      if (i !== -1) sales.value[i] = payload
      return
    }
    const res = await api.put(`/sales/${payload.id}`, payload)
    const updated = normalizeSale(getResponseData(res, payload))
    const i = sales.value.findIndex(x => x.id === payload.id)
    if (i !== -1) sales.value[i] = updated
  }

  async function deleteSale(id) {
    if (!USE_MOCK) await api.delete(`/sales/${id}`)
    sales.value = sales.value.filter(x => x.id !== id)
  }

  return { sales, loading, fetchSales, addSale, updateSale, deleteSale }
})
