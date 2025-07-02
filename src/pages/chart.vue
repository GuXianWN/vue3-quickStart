<script setup lang="ts">
import 'echarts'
import { EChartsOption } from 'echarts'
import VChart from 'vue-echarts'

const rowData = ref<SpcData[]>([])
const option = computed<EChartsOption>(() => {
	let sorted = _.sortBy(rowData.value, v => `${v.fab}-${v.processTime}`)

	let op: EChartsOption = {
		xAxis: {
			type: 'category',
			data: sorted.map(v => `${v.fab}-${v.processTime}`)
		},
		yAxis: {
			type: 'value',
			min: 'dataMin',
			max: 'dataMax',
			boundaryGap: ['10%', '10%']
		},
		series: [
			{
				data: sorted.map(v => v.point),
				type: 'scatter'
			}
		]
	}
	return op
})

onMounted(() => {
	rowData.value = generateData(3000)
})
</script>

<template>
	<div class="h-screen w-screen">
		<v-chart :option="option" autoresize />
	</div>
</template>

<style scoped></style>
