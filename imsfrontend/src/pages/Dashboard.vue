<template>
  <DashboardLayout>
    <h2 style="font-size:24px; margin-bottom:20px;">Dashboard</h2>

    <div style="display:flex; gap:20px;">
      <div style="background:#1abc9c; color:white; padding:20px; flex:1; border-radius:8px; text-align:center;">
        <h3>Products</h3>
        <p>0</p>
      </div>
      <div style="background:#e67e22; color:white; padding:20px; flex:1; border-radius:8px; text-align:center;">
        <h3>Stock In</h3>
        <p>0</p>
      </div>
      <div style="background:#e74c3c; color:white; padding:20px; flex:1; border-radius:8px; text-align:center;">
        <h3>Stock Out</h3>
        <p>0</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from '../layouts/DashboardLayout.vue'
</script>
