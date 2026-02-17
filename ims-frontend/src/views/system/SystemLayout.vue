<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-brand">System Administration</h1>
    </div>

    <div class="flex gap-2 border-b pb-3">
      <RouterLink to="/system/businesses" class="tab">Businesses</RouterLink>
      <RouterLink to="/system/subscriptions" class="tab">Subscription Payments</RouterLink>
      <RouterLink to="/system/roles" class="tab">Roles</RouterLink>
      <RouterLink to="/system/reports" class="tab">Reports</RouterLink>
    </div>

    <RouterView />
  </div>
</template>

<script setup></script>

<style scoped>
.text-brand {
  color: rgb(76, 38, 131);
}
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
