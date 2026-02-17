export const PERMISSIONS = {
  dashboard: [
    'superadmin','owner','admin','manager',
    'store_keeper','warehouse_manager',
    'sale','purchase','accountant','auditor','support'
  ],

  products: [
    'superadmin','owner','admin','manager','store_keeper','warehouse_manager'
  ],

  inventory: [
    'superadmin','owner','admin','manager','store_keeper','warehouse_manager'
  ],

  purchases: [
    'superadmin','owner','admin','manager','purchase','accountant'
  ],

  sales: [
    'superadmin','owner','admin','manager','sale','accountant'
  ],

  users: [
    'superadmin','owner','admin'
  ],

  suppliers: [
    'superadmin','owner','admin','purchase','manager'
  ],

  customers: [
    'superadmin','owner','admin','sale','manager'
  ],

  reports: [
    'superadmin','owner','admin','manager','accountant','auditor'
  ],

  system: [
    'superadmin','support'
  ],

  customer_request: [
    'customer'
  ]
}
