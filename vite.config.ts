import Tov from './presets'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [Tov()],
	build: {
		rollupOptions: {
			output: {
				entryFileNames: `[name].[hash].js`,
				chunkFileNames: `[name].[hash].js`,
				assetFileNames: `[name].[hash].[ext]`
			}
		}
	}
})
