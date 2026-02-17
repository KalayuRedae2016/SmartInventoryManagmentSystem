<template>
  <div class="space-y-4">
    <!-- Sales Tabs -->
    <div class="flex gap-2 border-b pb-3">
      <RouterLink to="/sales/invoices" class="tab">Invoices</RouterLink>
      <RouterLink to="/sales/invoice/new" class="tab">New Invoice</RouterLink>
      <RouterLink to="/sales/payments" class="tab">Payments</RouterLink>
      <RouterLink to="/sales/returns" class="tab">Returns</RouterLink>
    </div>

    <!-- Child Pages -->
    <RouterView />
  </div>
</template>

<script setup></script>

<style scoped>
.tab {
  padding: 6px 12px;
  border-radius: 6px;
  background: #e5e7eb;
  font-weight: 500;
}
.router-link-active {
  background: rgb(76, 38, 131);
  color: white;
}
</style>
