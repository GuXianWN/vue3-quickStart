# RBush 空间碰撞检测流程文档

## 概述

使用 RBush 空间索引库实现高性能的散点图数据采样和碰撞检测，解决大数据量渲染中的点重叠问题。

## 核心原理

RBush 是一个基于 R-tree 算法的 2D 空间索引库，能够在 O(log n) 时间复杂度内完成空间查询。

### R-tree 空间索引结构
```
画布空间被递归分割成多个矩形区域
每个节点包含：
- 边界矩形 (minX, minY, maxX, maxY)
- 子节点或数据点
- 自动平衡的树结构
```

## 检测流程详解

### 1. 初始化阶段
```javascript
import RBush from 'rbush'

// 创建空间索引实例
const spatialIndex = new RBush()

// 参数配置
const config = {
  renderRadius: 2,          // 实际渲染半径（整数）
  collisionSize: 4.5        // 碰撞检测边长（支持小数，控制渲染密度）
}
```

### 2. 数据预处理
```javascript
// 原始数据归一化到像素坐标
const normalizeToPixel = (point, canvasSize, dataRange) => {
  const [x, y] = point
  const [xMin, xMax] = dataRange.xRange
  const [yMin, yMax] = dataRange.yRange

  return [
    ((x - xMin) / (xMax - xMin)) * canvasSize.width,
    ((y - yMin) / (yMax - yMin)) * canvasSize.height
  ]
}
```

### 3. 碰撞检测核心流程

#### Step 1: 计算碰撞边界
```javascript
const createBoundingBox = (centerX, centerY, collisionSize) => {
  const halfSize = collisionSize / 2
  return {
    minX: centerX - halfSize,
    minY: centerY - halfSize,
    maxX: centerX + halfSize,
    maxY: centerY + halfSize,
    data: { x: centerX, y: centerY, collisionSize }
  }
}
```

#### Step 2: 空间查询
```javascript
const shouldRender = (point, collisionSize) => {
  const [pixelX, pixelY] = normalizeToPixel(point)

  // 创建查询边界
  const queryBox = createBoundingBox(pixelX, pixelY, collisionSize)

  // 在空间索引中查找重叠的矩形
  const conflicts = spatialIndex.search(queryBox)

  // 简化逻辑：有重叠就不渲染
  return conflicts.length === 0
}
```

#### Step 3: 简化的碰撞判断
```javascript
// 简化后的逻辑：只要有空间重叠就不渲染
// 通过调整 collisionSize 来控制渲染密度
// - collisionSize 越大：渲染越稀疏
// - collisionSize 越小：渲染越密集
```

#### Step 4: 更新空间索引
```javascript
const addRenderedPoint = (pixelX, pixelY, collisionSize) => {
  const bbox = createBoundingBox(pixelX, pixelY, collisionSize)
  spatialIndex.insert(bbox)
}
```

## 完整渲染流程

### 1. 数据采样和渲染
```javascript
const processData = (rawData) => {
  const renderedData = []
  spatialIndex.clear() // 清空索引

  for (const point of rawData) {
    if (shouldRender(point, config.collisionSize)) {
      const [pixelX, pixelY] = normalizeToPixel(point)

      // 添加到渲染数据
      renderedData.push(point)

      // 更新空间索引
      addRenderedPoint(pixelX, pixelY, config.collisionSize)
    }
  }

  return renderedData
}
```

### 2. DataZoom 支持
```javascript
const onDataZoom = (zoomParams) => {
  const visibleRange = getVisibleRange(zoomParams)
  const visibleData = filterDataByRange(rawData, visibleRange)

  // 根据缩放级别调整碰撞大小
  const zoomLevel = calculateZoomLevel(visibleRange)
  const adaptiveCollisionSize = adjustCollisionSize(config.collisionSize, zoomLevel)

  // 重新处理可见范围内的数据
  const newRenderedData = processData(visibleData, adaptiveCollisionSize)

  // 更新图表
  updateChart(newRenderedData)
}
```

## 性能特征

### 时间复杂度
- **查询**: O(log n)
- **插入**: O(log n)
- **删除**: O(log n)

### 空间复杂度
- **索引存储**: O(n)
- **内存开销**: 约为数据点数量的 2-3 倍

### 实际性能
- **数据量**: 支持百万级数据点
- **查询速度**: 毫秒级响应
- **内存使用**: 相对较低

## 参数调优指南

### collisionSize (碰撞大小) - 唯一控制参数
- **< renderRadius**: 允许点重叠，密集效果
- **= renderRadius**: 刚好不重叠
- **> renderRadius**: 点分散，稀疏效果

### 动态调整策略
```javascript
const adjustCollisionSize = (baseSize, zoomLevel) => {
  // 缩放时动态调整碰撞大小
  // zoomLevel 越大，显示越详细，collisionSize 可以越小
  return Math.max(baseSize * (1 - zoomLevel * 0.5), baseSize * 0.2)
}
```

## 使用示例

```javascript
// 安装依赖
npm install rbush

// 基本用法
const spatialIndex = new RBush()
const config = { renderRadius: 2, collisionSize: 4.5 }

rawData.forEach(point => {
  if (shouldRender(point, config.collisionSize)) {
    const [x, y] = normalizeToPixel(point)
    renderedData.push(point)
    addRenderedPoint(x, y, config.collisionSize)
  }
})
```

## 优势总结

1. **高性能**: O(log n) 查询复杂度
2. **精确检测**: 无边界问题，可靠的重叠检测
3. **简洁控制**: 单一 collisionSize 参数控制渲染密度
4. **扩展性好**: 支持大数据量，易于集成 DataZoom
5. **内存友好**: 相对较低的空间开销