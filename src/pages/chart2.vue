<script setup lang="ts">
import 'echarts'
import { EChartsOption } from 'echarts'
import VChart from 'vue-echarts'
import RBush from 'rbush'

// 原始数据生成
const rawData = _.chain(1000)
  .times(x => _.times(200, () => [x + 1, _.random(0, 10, true)]))
  .flatten()
  .value()

// 配置参数
const config = {
  renderRadius: 4,          // 实际渲染半径（整数）
  collisionSize: 1.6,       // 碰撞检测边长（支持小数）
  canvasWidth: 800,
  canvasHeight: 600,
  // 数据范围 - 直接定义，与rawData生成逻辑一致
  dataRange: {
    xRange: [1, 1000] as [number, number],    // x轴范围: 1到1000
    yRange: [0, 10] as [number, number]       // y轴范围: 0到10
  }
}

// 空间索引 - 在渲染过程中动态维护
const spatialIndex = new RBush()

// 性能统计
const performanceStats = ref({
  totalRenderTime: 0,     // 整体渲染时间（毫秒）
  rbushTime: 0,          // RBush 计算时间（毫秒）
  renderedPoints: 0,     // 实际渲染的点数
  totalPoints: rawData.length  // 总点数
})

// 渲染开始时间
let renderStartTime = 0
let currentRbushTime = 0
let currentRenderedCount = 0

// 坐标归一化函数
const normalizeToPixel = (point: [number, number]): [number, number] => {
  const [x, y] = point
  const [xMin, xMax] = config.dataRange.xRange
  const [yMin, yMax] = config.dataRange.yRange

  return [
    ((x - xMin) / (xMax - xMin)) * config.canvasWidth,
    ((y - yMin) / (yMax - yMin)) * config.canvasHeight
  ]
}

// 创建边界框
const createBoundingBox = (centerX: number, centerY: number, collisionSize: number, id: string) => {
  const halfSize = collisionSize / 2
  return {
    minX: centerX - halfSize,
    minY: centerY - halfSize,
    maxX: centerX + halfSize,
    maxY: centerY + halfSize,
    data: { id, x: centerX, y: centerY, collisionSize }
  }
}

const option = computed<EChartsOption>(() => {
	// 记录渲染开始时间
	renderStartTime = performance.now()

	// 每次重新渲染时清空空间索引和统计
	spatialIndex.clear()
	currentRbushTime = 0
	currentRenderedCount = 0

	let option: EChartsOption = {
		xAxis: {
			type: 'value'
		},
		yAxis: {
			type: 'value'
		},
		toolbox:{
			feature:{
				dataZoom:{},
				restore:{}
			}
		},
		series: [{
			type: 'custom',
			renderItem: (params: any, api: any) => {
				// 获取原始数据点
				const dataPoint = [api.value(0), api.value(1)] as [number, number]
				const pointId = `${params.dataIndex}`

				// 归一化到像素坐标
				const [pixelX, pixelY] = normalizeToPixel(dataPoint)

				// 创建碰撞检测边界
				const queryBox = createBoundingBox(pixelX, pixelY, config.collisionSize, pointId)

				// RBush 计算开始计时
				const rbushStartTime = performance.now()

				// 检查是否与已渲染点碰撞
				const conflicts = spatialIndex.search(queryBox)

				if (conflicts.length > 0) {
					// 有碰撞，不渲染
					const rbushEndTime = performance.now()
					currentRbushTime += (rbushEndTime - rbushStartTime)
					return null
				}

				// 无碰撞，添加到空间索引
				spatialIndex.insert(queryBox)

				// RBush 计算结束计时
				const rbushEndTime = performance.now()
				currentRbushTime += (rbushEndTime - rbushStartTime)

				// 渲染计数
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
			data: rawData  // 直接使用原始数据
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
		rbushTime: currentRbushTime,
		renderedPoints: currentRenderedCount,
		totalPoints: rawData.length
	}

	// 输出性能统计
	console.log('🎯 ECharts渲染完成 - 性能统计:', {
		'总渲染时间': `${performanceStats.value.totalRenderTime.toFixed(2)}ms`,
		'RBush计算时间': `${performanceStats.value.rbushTime.toFixed(2)}ms`,
		'RBush占比': `${(performanceStats.value.rbushTime / performanceStats.value.totalRenderTime * 100).toFixed(1)}%`,
		'渲染点数': `${performanceStats.value.renderedPoints}/${performanceStats.value.totalPoints}`,
		'采样率': `${(performanceStats.value.renderedPoints / performanceStats.value.totalPoints * 100).toFixed(1)}%`
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
