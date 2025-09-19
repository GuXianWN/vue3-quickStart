<script setup lang="ts">
import 'echarts'
import { EChartsOption } from 'echarts'
import VChart from 'vue-echarts'

// 原始数据生成 - 与 chart2 完全相同
const rawData = _.chain(1000)
  .times(x => _.times(200, () => [x + 1, _.random(0, 10, true)]))
  .flatten()
  .value()

// 配置参数 - 与 chart2 相同
const config = {
  renderRadius: 4,          // 实际渲染半径（整数）
  canvasWidth: 800,
  canvasHeight: 600,
  // 数据范围 - 直接定义，与rawData生成逻辑一致
  dataRange: {
    xRange: [1, 1000] as [number, number],    // x轴范围: 1到1000
    yRange: [0, 10] as [number, number]       // y轴范围: 0到10
  }
}

// 性能统计
const performanceStats = ref({
  totalRenderTime: 0,     // 整体渲染时间（毫秒）
  renderedPoints: rawData.length,  // 直接渲染所有点
  totalPoints: rawData.length      // 总点数
})

// 渲染开始时间
let renderStartTime = 0
let currentRenderedCount = 0

const option = computed<EChartsOption>(() => {
	// 记录渲染开始时间
	renderStartTime = performance.now()
	currentRenderedCount = 0

	let option: EChartsOption = {
		xAxis: {
			type: 'value'
		},
		yAxis: {
			type: 'value'
		},
		toolbox: {
			feature: {
				dataZoom: {},
				restore: {}
			}
		},
		series: [{
			type: 'custom',
			renderItem: (params: any, api: any) => {
				// 渲染计数 - 但不进行碰撞检测
				currentRenderedCount++

				// 获取ECharts坐标系下的点位置
				const point = api.coord([api.value(0), api.value(1)])

				return {
					type: 'circle',
					shape: {
						cx: point[0],
						cy: point[1],
						r: config.renderRadius
					},
					style: {
						fill: '#5470c6',
						opacity: 0.7
					}
				}
			},
			data: rawData  // 直接渲染全部原始数据，无碰撞检测
		}]
	}

	return option
})

// ECharts 渲染完成回调
const onChartRendered = () => {
	const totalEndTime = performance.now()

	// 更新性能统计
	performanceStats.value = {
		totalRenderTime: totalEndTime - renderStartTime,
		renderedPoints: rawData.length,
		totalPoints: rawData.length
	}

	// 输出性能统计 - 用不同的标识区分
	console.log('🚀 Custom无采样渲染完成 - 性能统计:', {
		'总渲染时间': `${performanceStats.value.totalRenderTime.toFixed(2)}ms`,
		'渲染点数': `${currentRenderedCount}/${performanceStats.value.totalPoints}`,
		'采样率': `100%`,
		'碰撞检测': '无'
	})
}
</script>

<template>
	<div class="h-screen w-screen">
		<v-chart
			:option="option"
			autoresize
			@finished="onChartRendered"
		/>
	</div>
</template>