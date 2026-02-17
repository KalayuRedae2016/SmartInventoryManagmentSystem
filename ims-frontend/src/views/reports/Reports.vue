<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-3 border-b pb-3">
      <div>
        <h1 class="text-2xl font-bold text-brand">Reports</h1>
        <div class="text-sm text-gray-500">All business reports in one place</div>
      </div>
      <div class="flex flex-wrap items-end gap-2">
        <div class="filter-field">
          <label class="filter-label">From</label>
          <input type="date" class="filter-input" />
        </div>
        <div class="filter-field">
          <label class="filter-label">To</label>
          <input type="date" class="filter-input" />
        </div>
        <div class="filter-field">
          <label class="filter-label">Period</label>
          <select class="filter-input">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
            <option>Custom</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Sales -->
    <section class="report-section">
      <div class="section-header">
        <span class="section-icon">[S]</span>
        <h2 class="section-title">Sales</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink to="/reports?type=sales-summary" class="report-card">
          <div class="report-head">
            <span class="card-icon">[R]</span>
            <h3 class="report-title">Sales Summary</h3>
          </div>
          <p class="report-desc">Revenue, invoices, and payments by period.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
        <RouterLink to="/reports?type=sales-returns" class="report-card">
          <div class="report-head">
            <span class="card-icon">[R]</span>
            <h3 class="report-title">Sales Returns</h3>
          </div>
          <p class="report-desc">Returned items, reasons, and value impact.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
        <RouterLink to="/reports?type=profit-loss" class="report-card">
          <div class="report-head">
            <span class="card-icon">[P]</span>
            <h3 class="report-title">Profit and Loss</h3>
          </div>
          <p class="report-desc">Gross margin, net profit, and expense split.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
      </div>
    </section>

    <!-- Purchases -->
    <section class="report-section">
      <div class="section-header">
        <span class="section-icon">[P]</span>
        <h2 class="section-title">Purchases</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink to="/reports?type=purchases-summary" class="report-card">
          <div class="report-head">
            <span class="card-icon">[R]</span>
            <h3 class="report-title">Purchases Summary</h3>
          </div>
          <p class="report-desc">Purchases, expenses, and supplier spend.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
        <RouterLink to="/reports?type=purchase-returns" class="report-card">
          <div class="report-head">
            <span class="card-icon">[R]</span>
            <h3 class="report-title">Purchase Returns</h3>
          </div>
          <p class="report-desc">Returned purchases and adjustments.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
        <RouterLink to="/reports?type=supplier-ledger" class="report-card">
          <div class="report-head">
            <span class="card-icon">[L]</span>
            <h3 class="report-title">Supplier Ledger</h3>
          </div>
          <p class="report-desc">Supplier balances, bills, and aging.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
      </div>
    </section>

    <!-- Inventory -->
    <section class="report-section">
      <div class="section-header">
        <span class="section-icon">[I]</span>
        <h2 class="section-title">Inventory</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink to="/reports?type=inventory-valuation" class="report-card">
          <div class="report-head">
            <span class="card-icon">[V]</span>
            <h3 class="report-title">Inventory Valuation</h3>
          </div>
          <p class="report-desc">Stock value by category, brand, and warehouse.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
        <RouterLink to="/reports?type=stock-transactions" class="report-card">
          <div class="report-head">
            <span class="card-icon">[T]</span>
            <h3 class="report-title">Stock Transactions</h3>
          </div>
          <p class="report-desc">Transfers and adjustments history.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
        <RouterLink to="/reports?type=low-stock" class="report-card">
          <div class="report-head">
            <span class="card-icon">[!]</span>
            <h3 class="report-title">Low Stock</h3>
          </div>
          <p class="report-desc">Items below minimum level with reorder hints.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
      </div>
    </section>

    <!-- Finance & People -->
    <section class="report-section">
      <div class="section-header">
        <span class="section-icon">[F]</span>
        <h2 class="section-title">Finance & People</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink to="/reports?type=customer-ledger" class="report-card">
          <div class="report-head">
            <span class="card-icon">[L]</span>
            <h3 class="report-title">Customer Ledger</h3>
          </div>
          <p class="report-desc">Customer balances, payments, and aging.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
        <RouterLink to="/reports?type=tax-summary" class="report-card">
          <div class="report-head">
            <span class="card-icon">[T]</span>
            <h3 class="report-title">Tax Summary</h3>
          </div>
          <p class="report-desc">Taxable sales, input tax, and liabilities.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
        <RouterLink to="/reports?type=user-activity" class="report-card">
          <div class="report-head">
            <span class="card-icon">[U]</span>
            <h3 class="report-title">User Activity</h3>
          </div>
          <p class="report-desc">Actions by user, approvals, and audits.</p>
          <span class="report-action">Open report</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup></script>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-label {
  font-size: 12px;
  color: #6b7280;
}
.filter-input {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 8px;
  background: #fff;
  font-size: 14px;
}
.report-section {
  display: block;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.section-icon {
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 6px;
  background: #f3f4f6;
  color: #111827;
}
.section-title {
  font-weight: 600;
  color: #111827;
}
.report-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.report-card:hover {
  transform: translateY(-2px);
  border-color: rgba(76, 38, 131, 0.35);
  box-shadow: 0 6px 14px rgba(76, 38, 131, 0.12);
}
.report-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-icon {
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 6px;
  background: #f3f4f6;
  color: #111827;
}
.report-title {
  font-weight: 600;
  color: #111827;
}
.report-desc {
  font-size: 14px;
  color: #6b7280;
}
.report-action {
  font-size: 12px;
  color: rgb(76, 38, 131);
  font-weight: 600;
}
</style>
