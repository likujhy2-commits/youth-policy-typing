import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // 대기 화면 상태 표시용 빌드 식별자 (CI에서는 커밋 해시, 로컬은 dev)
    __BUILD_ID__: JSON.stringify((process.env.GITHUB_SHA ?? 'dev').slice(0, 7)),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
