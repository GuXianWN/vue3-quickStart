import _ from 'lodash';
import dayjs from 'dayjs';

export function generateData(count: number): SpcData[] {
	// 基础配置
	const config = {
		fabs: ['fab1', 'fab2'],
		generations: ['g1', 'g2', 'g3'],
		metEqps: ['MET1-CHA', 'MET2-CHB', 'MET3-ACC'],
		products: ['A100', 'A200', 'B500', 'C300', 'D700'],
		processEqps: ['EQP-001', 'EQP-002', 'EQP-101', 'EQP-201', 'EQP-202']
	};

	// 日期范围 (2025年6月)
	const startDate = dayjs('2025-06-01');
	const endDate = dayjs('2025-06-30');

	// 生成数据点 (95%正常, 4% OOC, 1% OOS)
	const generateDataPoint = (target: number, variation: number) => {
		const rand = _.random(0, 1, true);

		if (rand <= 0.95) {
			// 95% 正常数据 (在控制限内)
			return _.random(target - variation * 2.5, target + variation * 2.5, true);
		} else if (rand <= 0.99) {
			// 4% OOC (超出控制限但在规格限内)
			return _.sample([
				_.random(target - variation * 3.5, target - variation * 3.1, true),
				_.random(target + variation * 3.1, target + variation * 3.5, true)
			]) as number;
		} else {
			// 1% OOS (超出规格限)
			return _.sample([
				_.random(target - variation * 6, target - variation * 5.1, true),
				_.random(target + variation * 5.1, target + variation * 6, true)
			]) as number;
		}
	};

	// 生成批号
	const generateLotId = (index: number) =>
		`LOT-${dayjs().format('YYMMDD')}-${_.padStart(index.toString(), 4, '0')}`;

	// 生成数据
	return _.times(count, (index) => {
		// 随机选择配置
		const fab = _.sample(config.fabs)!;
		const generation = _.sample(config.generations)!;
		const metEqp = _.sample(config.metEqps)!;
		const product = _.sample(config.products)!;
		const processEqp = _.sample(config.processEqps)!;

		// 目标值和过程变异
		const target = _.random(95, 105, true);
		const variation = _.random(1.5, 3.0, true);

		// 生成数据点
		const point = generateDataPoint(target, variation);

		// 确定状态
		const isOOC = point < target - variation * 3 || point > target + variation * 3;
		const isOOS = point < target - variation * 5 || point > target + variation * 5;

		return {
			fab,
			generation,
			product,
			processEqp,
			metEqp,
			lotId: generateLotId(index),
			waferId: `WAF-${_.padStart(_.random(1, 999).toString(), 3, '0')}`,
			processTime: startDate.add(_.random(0, endDate.diff(startDate, 'minute')), 'minute')
				.format('YYYY-MM-DD HH:mm:ss'),
			target,
			lcl: _.round(target - variation * 3, 2),
			ucl: _.round(target + variation * 3, 2),
			lsl: _.round(target - variation * 5, 2),
			usl: _.round(target + variation * 5, 2),
			point: _.round(point, 3),
			comment: isOOS ? 'OOS Detected' : (isOOC ? 'OOC Detected' : '')
		};
	});
}
