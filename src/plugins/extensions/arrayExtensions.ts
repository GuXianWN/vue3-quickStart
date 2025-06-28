import { _ } from '~/composables/lodash';

type GroupKey = string | number | symbol;
type GroupKeyFn<T> = (item: T) => GroupKey;
type GroupProcessor<T, R = any> = (items: T[]) => R;

/**
 * 数组扩展方法
 */
declare global {
  interface Array<T> {
    /**
     * 分组方法
     * @param key 分组键或键函数
     * @param processor 可选的数据处理函数
     */
    groupBy<K extends GroupKey, R = T[]>(
      key: string | GroupKeyFn<T>,
      processor?: GroupProcessor<T, R>
    ): Record<K, R>;

    /**
     * 多层分组方法
     * @param keys 分组键或键函数数组
     * @param processor 可选的数据处理函数
     */
    groupByMulti<R = any>(
      keys: Array<string | GroupKeyFn<any>>,
      processor?: GroupProcessor<any, R>
    ): Record<string, any>;
  }
}

// 实现单层分组
if (!Array.prototype.groupBy) {
  Array.prototype.groupBy = function<T, K extends GroupKey, R = T[]>(
    key: string | GroupKeyFn<T>,
    processor?: GroupProcessor<T, R>
  ): Record<K, R> {
    const keyFn = typeof key === 'string'
      ? (item: T) => item[key as keyof T] as K
      : key as GroupKeyFn<T>;

    const grouped = _.groupBy(this, keyFn) as Record<K, T[]>;

    return processor
      ? Object.fromEntries(
          Object.entries(grouped).map(([k, v]) => [k, processor(v as T[])])
        ) as Record<K, R>
      : grouped as Record<K, R>;
  };
}

// 实现多层分组
if (!Array.prototype.groupByMulti) {
  Array.prototype.groupByMulti = function<R = any>(
    keys: Array<string | GroupKeyFn<any>>,
    processor?: GroupProcessor<any, R>
  ): Record<string, any> {
    if (keys.length === 0) return {};
    if (keys.length === 1) {
      return this.groupBy(keys[0], processor);
    }

    const [currentKey, ...remainingKeys] = keys;
    const grouped = this.groupBy(currentKey);

    return Object.entries(grouped).reduce((acc, [key, items]) => {
      acc[key] = (items as any[]).groupByMulti(remainingKeys, processor);
      return acc;
    }, {} as Record<string, any>);
  };
}

export {};
