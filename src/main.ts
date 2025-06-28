// https://unocss.dev/ 原子 css 库
import '@unocss/reset/tailwind-compat.css' // unocss reset
import 'virtual:uno.css'
import 'virtual:unocss-devtools'

// 你自定义的 css
import './styles/main.css'

import App from './App.vue'
import extensionsPlugin from './plugins/extensions'

const app = createApp(App)

// 安装原生对象扩展
app.use(extensionsPlugin)

app.mount('#app')
