<template>
  <canvas ref="chartRef"></canvas>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
defineProps({ data: Object })

const chartRef = ref(null)
let chartInstance = null

onMounted(() => {
  chartInstance = new Chart(chartRef.value, {
    type: 'line',
    data: props.data,
    options: { responsive: true, plugins: { legend: { display: false } } }
  })
})

watch(() => props.data, (newData) => {
  chartInstance.data = newData
  chartInstance.update()
})
</script>
