import api from '@/services/api'

/**
 * SINGLE ENTRY POINT for ALL stock mutations
 */
export default {

  /* =========================
     PURCHASE → STOCK IN
  ========================= */
  async purchaseIn({ productId, warehouseId, qty, purchaseId }) {
    return api.post('/stock/ledger', {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: +qty,
      source_type: 'purchase',
      source_id: purchaseId,
      reason: 'Purchase received'
    })
  },

  /* =========================
     SALE → STOCK OUT
  ========================= */
  async saleOut({ productId, warehouseId, qty, saleId }) {
    return api.post('/stock/ledger', {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: -qty,
      source_type: 'sale',
      source_id: saleId,
      reason: 'Sale invoice'
    })
  },

  /* =========================
     SALE RETURN → STOCK BACK
  ========================= */
  async saleReturn({ productId, warehouseId, qty, saleId }) {
    return api.post('/stock/ledger', {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: +qty,
      source_type: 'sale_return',
      source_id: saleId,
      reason: 'Sale return'
    })
  },

  /* =========================
     PURCHASE RETURN → STOCK OUT
  ========================= */
  async purchaseReturn({ productId, warehouseId, qty, purchaseId }) {
    return api.post('/stock/ledger', {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: -qty,
      source_type: 'purchase_return',
      source_id: purchaseId,
      reason: 'Purchase return'
    })
  },

  /* =========================
     TRANSFER
  ========================= */
  async transfer({ productId, fromWarehouse, toWarehouse, qty, transferId }) {
    // OUT
    await api.post('/stock/ledger', {
      product_id: productId,
      warehouse_id: fromWarehouse,
      quantity: -qty,
      source_type: 'transfer_out',
      source_id: transferId,
      reason: 'Stock transfer out'
    })

    // IN
    await api.post('/stock/ledger', {
      product_id: productId,
      warehouse_id: toWarehouse,
      quantity: +qty,
      source_type: 'transfer_in',
      source_id: transferId,
      reason: 'Stock transfer in'
    })
  },

  /* =========================
     MANUAL ADJUSTMENT
  ========================= */
  async adjust({ productId, warehouseId, qty, note }) {
    return api.post('/stock/ledger', {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: qty,
      source_type: 'adjustment',
      reason: note || 'Manual adjustment'
    })
  }
}
