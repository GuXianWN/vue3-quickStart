import type { App } from 'vue';
import './arrayExtensions';

/**
 * 安装原生对象扩展插件
 */
export const installExtensions = () => {
  if (import.meta.env.DEV) {
    console.debug('原生对象扩展已激活');
  }
};

/**
 * Vue插件安装方法
 */
export const extensionsPlugin = {
  install(app: App) {
    installExtensions();
  }
};

// 默认导出插件
export default extensionsPlugin;