import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// =======================
// Layout
// =======================
import MainLayout from '@/layouts/MainLayout.vue'

// =======================
// Lazy Views
// =======================

// Auth
const Login = () => import('@/views/auth/Login.vue')
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue')
const SignUp = () => import('@/views/auth/SignUp.vue')

// Core
const Dashboard = () => import('@/views/core/Dashboard.vue')
const NotFound = () => import('@/views/core/NotFound.vue')

// Products
const Products = () => import('@/views/inventory/Products.vue')
const Categories = () => import('@/views/products/Categories.vue')
const Brands = () => import('@/views/products/Brands.vue')
const Units = () => import('@/views/products/Units.vue')

// Stock
const StockTransfers = () => import('@/views/stock/StockTransfers.vue')
const StockTransactions = () => import('@/views/stock/StockTransactions.vue')
const StockAdjustments = () => import('@/views/stock/StockAdjustments.vue')
const StockOverview = () => import('@/views/stock/Stock.vue')
const StockHistory = () => import('@/views/stock/StockHistory.vue')
const Warehouses = () => import('@/views/stock/Warehouses.vue')

// Purchases
const PurchasesLayout = () => import('@/views/purchases/PurchasesLayout.vue')
const PurchasesList = () => import('@/views/purchases/Purchases.vue')
const PurchaseForm = () => import('@/views/purchases/PurchaseForm.vue')
const PurchaseDetail = () => import('@/views/purchases/PurchaseDetail.vue')
const PurchaseReturns = () => import('@/views/purchases/PurchaseReturns.vue')

// =======================
// SALES (IMPORTANT)
// =======================
const SalesLayout = () => import('@/views/sales/Sales.vue')
const SalesInvoices = () => import('@/views/sales/SalesInvoices.vue')
const InvoiceForm = () => import('@/views/sales/InvoiceForm.vue')
const InvoiceDetails = () => import('@/views/sales/InvoiceDetails.vue')
const SalesReturns = () => import('@/views/sales/SalesReturns.vue')
const SalesPayments = () => import('@/views/sales/SalesPayments.vue')

// =======================
// SYSTEM (SUPERADMIN)
// =======================
const SystemLayout = () => import('@/views/system/SystemLayout.vue')
const SystemBusinesses = () => import('@/views/system/Businesses.vue')
const SystemSubscriptions = () => import('@/views/system/Subscriptions.vue')
const SystemRoles = () => import('@/views/system/Roles.vue')
const SystemReports = () => import('@/views/system/SystemReports.vue')

// People
const Users = () => import('@/views/people/Users.vue')
const Customers = () => import('@/views/people/Customers.vue')
const Suppliers = () => import('@/views/suppliers/Suppliers.vue')

// Requests
const Requests = () => import('@/views/customer/CustomerRequests.vue')
// Reports
const Reports = () => import('@/views/reports/Reports.vue')

// =======================
// Routes
// =======================
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },

  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { public: true }
  },
  {
    path: '/sign-up',
    name: 'SignUp',
    component: SignUp,
    meta: { public: true }
  },

  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard,
        meta: { permission: 'dashboard.view' }
      },

      // ---------- Products ----------
      { path: 'products', component: Products, meta: { permission: 'products.view' } },
      { path: 'categories', component: Categories, meta: { permission: 'categories.view' } },
      { path: 'brands', component: Brands, meta: { permission: 'brands.view' } },
      { path: 'units', component: Units, meta: { permission: 'units.view' } },

      // ---------- Stock ----------
      { path: 'stock', component: StockOverview, meta: { permission: 'stock.view' } },
      { path: 'stock-transactions', component: StockTransactions, meta: { permission: 'stock.history' } },
      { path: 'stock-history', component: StockHistory, meta: { permission: 'stock.history' } },
      { path: 'stock-transfers', component: StockTransfers, meta: { permission: 'stock.transfer' } },
      { path: 'stock-adjustments', component: StockAdjustments, meta: { permission: 'stock.adjust' } },
      { path: 'warehouses', component: Warehouses, meta: { permission: 'warehouses.view' } },

      // ---------- Purchases ----------
      {
        path: 'purchases',
        component: PurchasesLayout,
        meta: { permission: 'purchases.view' },
        children: [
          { path: '', component: PurchasesList },
          { path: 'new', component: PurchaseForm, meta: { permission: 'purchases.create' } },
          { path: 'returns', component: PurchaseReturns },
          { path: ':id', component: PurchaseDetail }
        ]
      },

      // ================= SALES =================
      {
        path: 'sales',
        component: SalesLayout,
        meta: { permission: 'sales.view' },
        children: [
          { path: '', redirect: 'invoices' },
          { path: 'invoices', component: SalesInvoices },
          { path: 'invoice/new', component: InvoiceForm },
          { path: 'invoice/:id', component: InvoiceDetails },
          { path: 'payments', component: SalesPayments },
          { path: 'returns', component: SalesReturns }
        ]
      },

      // ================= SYSTEM (SUPERADMIN) =================
      {
        path: 'system',
        component: SystemLayout,
        meta: { permission: 'system.view' },
        children: [
          { path: '', redirect: 'businesses' },
          { path: 'businesses', component: SystemBusinesses },
          { path: 'subscriptions', component: SystemSubscriptions },
          { path: 'roles', component: SystemRoles },
          { path: 'reports', component: SystemReports }
        ]
      },

      // ---------- People ----------
      { path: 'users', component: Users, meta: { permission: 'users.view' } },
      { path: 'customers', component: Customers, meta: { permission: 'customers.view' } },
      { path: 'suppliers', component: Suppliers, meta: { permission: 'suppliers.view' } },

      // ---------- Requests ----------
      { path: 'customer-requests', component: Requests, meta: { permission: 'requests.view' } },
      { path: 'reports', component: Reports, meta: { permission: 'reports.view' } }
    ]
  },

  { path: '/:pathMatch(.*)*', component: NotFound }
]

// =======================
// Router
// =======================
const router = createRouter({
  history: createWebHistory(),
  routes
})

// =======================
// Guard
// =======================
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.public) return next()
  if (!auth.isAuthenticated) return next('/login')
  if (to.meta.permission && !auth.can(to.meta.permission)) {
    const fallbackPaths = ['/', '/products', '/stock', '/purchases', '/sales', '/customers', '/suppliers', '/reports']
    const fallback = fallbackPaths.find(path => {
      const resolved = router.resolve(path)
      const permission = resolved?.meta?.permission
      return !permission || auth.can(permission)
    })

    if (fallback && fallback !== to.fullPath) return next(fallback)
    return next('/login')
  }

  next()
})

export default router


