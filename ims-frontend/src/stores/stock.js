import { defineStore } from 'pinia'
import api, { getResponseData } from '@/services/api'
import { USE_MOCK } from '@/config/env'

export const useStockStore = defineStore('stock', {
  state: () => ({
    balances: [],
    stocks: [],
    transactions: [],
    dailyMovements: []
  }),

  actions: {
    async fetchStock() {
      if (USE_MOCK) {
        this.balances = [
          { product_id: 1, warehouse_id: 1, quantity: 12 },
          { product_id: 2, warehouse_id: 1, quantity: 40 },
          { product_id: 1, warehouse_id: 2, quantity: 5 }
        ]

        this.stocks = [
          { id: 1, productName: 'Laptop', warehouseName: 'Main Warehouse', quantity: 12, updatedAt: '2026-02-02' },
          { id: 2, productName: 'Mouse', warehouseName: 'Main Warehouse', quantity: 40, updatedAt: '2026-02-02' },
          { id: 3, productName: 'Laptop', warehouseName: 'Branch Warehouse', quantity: 5, updatedAt: '2026-02-01' }
        ]

        this.transactions = [
          { id: 1, date: '2026-02-01', product: 'Laptop', type: 'IN', quantity: 10, note: 'Purchase received' },
          { id: 2, date: '2026-02-02', product: 'Mouse', type: 'OUT', quantity: 5, note: 'Sale' },
          { id: 3, date: '2026-02-03', product: 'Laptop', type: 'TRANSFER', quantity: 2, note: 'Warehouse transfer' }
        ]

        this.dailyMovements = [
          { date: '2026-01-30', quantity: 5 },
          { date: '2026-01-31', quantity: 12 },
          { date: '2026-02-01', quantity: 8 },
          { date: '2026-02-02', quantity: 15 }
        ]
        return
      }

      const [txRes, mvRes] = await Promise.all([
        api.get('/stock-transactions'),
        api.get('/stock-movements')
      ])

      const txRows = this.asList(getResponseData(txRes, []))
      const mvRows = this.asList(getResponseData(mvRes, []))

      this.transactions = txRows.map(this.normalizeTransaction)
      this.dailyMovements = this.buildDailyMovements(txRows)
      this.stocks = mvRows.map(this.normalizeMovementToStock)
      this.balances = mvRows.map(m => ({
        product_id: m.productId ?? m.product_id,
        warehouse_id: m.warehouseId ?? m.warehouse_id ?? 0,
        quantity: m.newStock ?? m.new_stock ?? 0
      }))
    },

    asList(payload) {
      if (Array.isArray(payload)) return payload
      if (Array.isArray(payload?.rows)) return payload.rows
      return []
    },

    normalizeTransaction(row) {
      return {
        id: row.id,
        date: (row.createdAt || row.created_at || '').slice(0, 10),
        product: row.productName || `Product #${row.productId ?? row.product_id ?? '-'}`,
        type: row.transactionType || row.transaction_type || 'IN',
        quantity: row.qty ?? row.quantity ?? 0,
        note: `${row.referenceType || row.reference_type || 'transaction'} #${row.referenceId || row.reference_id || '-'}`
      }
    },

    normalizeMovementToStock(row) {
      return {
        id: row.id,
        productName: row.productName || `Product #${row.productId ?? row.product_id ?? '-'}`,
        warehouseName: row.warehouseName || '-',
        quantity: row.newStock ?? row.new_stock ?? 0,
        updatedAt: (row.createdAt || row.created_at || '').slice(0, 10)
      }
    },

    buildDailyMovements(rows) {
      const byDate = new Map()
      rows.forEach(r => {
        const date = (r.createdAt || r.created_at || '').slice(0, 10) || 'unknown'
        const qty = Number(r.qty ?? r.quantity ?? 0) || 0
        byDate.set(date, (byDate.get(date) || 0) + Math.abs(qty))
      })
      return Array.from(byDate.entries()).map(([date, quantity]) => ({ date, quantity }))
    },

    getQty(productId, warehouseId) {
      return (
        this.balances.find(
          s => s.product_id === productId && s.warehouse_id === warehouseId
        )?.quantity || 0
      )
    },

    decrease(product, qty, warehouseName = 'Main Warehouse', note = 'Stock OUT') {
      const today = new Date().toISOString().slice(0, 10)
      this.transactions.unshift({
        id: Date.now(),
        date: today,
        product,
        type: 'OUT',
        quantity: qty,
        note: `${note} (${warehouseName})`
      })
    },

    increase(product, qty, warehouseName = 'Main Warehouse', note = 'Stock IN') {
      const today = new Date().toISOString().slice(0, 10)
      this.transactions.unshift({
        id: Date.now(),
        date: today,
        product,
        type: 'IN',
        quantity: qty,
        note: `${note} (${warehouseName})`
      })
    },

    transfer(product, qty, fromWarehouse, toWarehouse) {
      this.transactions.unshift({
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        product,
        type: 'TRANSFER',
        quantity: qty,
        note: `From ${fromWarehouse} to ${toWarehouse}`
      })
    },

    adjustStock({ productName, warehouseName, quantity, reason }) {
      this.transactions.unshift({
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        product: productName,
        type: 'ADJUSTMENT',
        quantity: Math.abs(quantity),
        note: reason || `Adjustment (${warehouseName})`
      })
    },

    applyTransfer({ productName, fromWarehouse, toWarehouse, quantity }) {
      this.transactions.unshift({
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        product: productName,
        type: 'TRANSFER',
        quantity,
        note: `From ${fromWarehouse} to ${toWarehouse}`
      })
    }
  }
})
