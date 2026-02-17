export const stockBalances = [
  { product_id: 1, product: 'Laptop', warehouse_id: 1, warehouse: 'Main Store', quantity: 25 },
  { product_id: 2, product: 'Mouse', warehouse_id: 1, warehouse: 'Main Store', quantity: 120 },
  { product_id: 3, product: 'Keyboard', warehouse_id: 2, warehouse: 'Branch Store', quantity: 40 }
]

export const stockTransfers = [
  {
    id: 1,
    product: 'Laptop',
    from: 'Main Store',
    to: 'Branch Store',
    qty: 5,
    status: 'pending'
  },
  {
    id: 2,
    product: 'Mouse',
    from: 'Main Store',
    to: 'Branch Store',
    qty: 20,
    status: 'approved'
  }
]
