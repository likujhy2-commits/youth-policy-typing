import { useEffect } from 'react'

/** Wake Lock으로 화면 꺼짐 방지. 탭 복귀 시 재획득 */
export function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    let released = false

    const request = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          lock = await navigator.wakeLock.request('screen')
        }
      } catch {
        // 일부 브라우저/절전 상태에서 거부될 수 있음 — 무시
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !released) void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisibility)
      void lock?.release().catch(() => {})
    }
  }, [])
}
