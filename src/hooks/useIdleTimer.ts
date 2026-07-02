import { useEffect, useRef } from 'react'

/** 90초 무입력 시 콜백 (어트랙트 화면 자동 복귀용) */
export function useIdleTimer(onIdle: () => void, timeoutMs = 90_000, enabled = true) {
  const cbRef = useRef(onIdle)
  cbRef.current = onIdle

  useEffect(() => {
    if (!enabled) return
    let timer = window.setTimeout(() => cbRef.current(), timeoutMs)
    const bump = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => cbRef.current(), timeoutMs)
    }
    const events = ['keydown', 'pointerdown', 'touchstart', 'mousemove'] as const
    events.forEach((ev) => window.addEventListener(ev, bump))
    return () => {
      window.clearTimeout(timer)
      events.forEach((ev) => window.removeEventListener(ev, bump))
    }
  }, [timeoutMs, enabled])
}
