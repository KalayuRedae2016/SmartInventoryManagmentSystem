import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useInventoryStore = defineStore('inventory', () => {
  const stock = ref([
    {
      id: 'f1a2b3c4-5d6e-4f70-8a9b-0c1d2e3f4a10',
      business_id: '11111111-1111-1111-1111-111111111111',
      product_id: '9d9f8a12-0f4d-4f2f-9f8b-7a5a2c1b3d01',
      warehouse_id: '5a9e0c61-0a7b-4d7e-9a7b-1f2a0f8d6c01',
      type: 'IN',
      quantity: 50,
      reference_type: 'purchase',
      reference_id: 'c3b1f2e4-7b6a-4a0f-9b2c-1d3e5f6a7b01',
      created_by: '2f7b6c19-6a4c-4c4a-9b2a-6c8f2c9a1f01',
      created_at: '2026-01-20T09:00:00Z',
      product: 'Product A',
      date: '2026-01-20'
    },
    {
      id: 'f1a2b3c4-5d6e-4f70-8a9b-0c1d2e3f4a11',
      business_id: '11111111-1111-1111-1111-111111111111',
      product_id: 'a1b2c3d4-5678-4e9a-8b3c-2d1e0f9a8b02',
      warehouse_id: '5a9e0c61-0a7b-4d7e-9a7b-1f2a0f8d6c01',
      type: 'OUT',
      quantity: 20,
      reference_type: 'sale',
      reference_id: 'd0a1b2c3-4d5e-4f60-9a7b-8c9d0e1f2a01',
      created_by: '2f7b6c19-6a4c-4c4a-9b2a-6c8f2c9a1f01',
      created_at: '2026-01-21T10:00:00Z',
      product: 'Product B',
      date: '2026-01-21'
    },
    {
      id: 'f1a2b3c4-5d6e-4f70-8a9b-0c1d2e3f4a12',
      business_id: '11111111-1111-1111-1111-111111111111',
      product_id: '9d9f8a12-0f4d-4f2f-9f8b-7a5a2c1b3d01',
      warehouse_id: '1f4a3d99-7b35-4b66-9a22-0f1d3f5a9c11',
      type: 'ADJUSTMENT',
      quantity: 30,
      reference_type: 'transfer',
      reference_id: 'e1f2a3b4-5c6d-4e7f-8a9b-0c1d2e3f4a01',
      created_by: '2f7b6c19-6a4c-4c4a-9b2a-6c8f2c9a1f01',
      created_at: '2026-01-22T11:30:00Z',
      product: 'Product C',
      date: '2026-01-22'
    }
  ])

  function addStock(entry) {
    entry.id = stock.value.length + 1
    stock.value.push(entry)
  }

  function updateStock(id, updated) {
    const index = stock.value.findIndex(e => e.id === id)
    if (index !== -1) stock.value[index] = { ...stock.value[index], ...updated }
  }

  function deleteStock(id) {
    stock.value = stock.value.filter(e => e.id !== id)
  }

  return { stock, addStock, updateStock, deleteStock }
})
