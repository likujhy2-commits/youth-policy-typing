import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { SessionProvider, useSession } from './context/SessionContext'
import { useIdleTimer } from './hooks/useIdleTimer'
import { useWakeLock } from './hooks/useWakeLock'
import { startQueueAutoFlush } from './lib/offlineQueue'
import { refreshSentences } from './lib/sentences'
import AttractScreen from './screens/AttractScreen'
import RegisterScreen from './screens/RegisterScreen'
import ModeSelectScreen from './screens/ModeSelectScreen'
import GameRain from './screens/GameRain'
import GameSentence from './screens/GameSentence'
import GameLong from './screens/GameLong'
import ResultScreen from './screens/ResultScreen'
import AdminApp from './admin/AdminApp'

function KioskShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { resetSession } = useSession()
  const isAdmin = location.pathname.startsWith('/admin')
  const isAttract = location.pathname === '/'

  useWakeLock()

  // 120초 무입력 → 어트랙트 복귀 + 세션 초기화 (관리자·어트랙트 화면 제외)
  // 주의: 장문 챌린지가 90초 게임이라 무입력 타이머는 반드시 그보다 길어야 한다
  // (같거나 짧으면 무입력 플레이 시 결과 저장 전에 어트랙트로 튕김)
  useIdleTimer(
    () => {
      resetSession()
      navigate('/')
    },
    120_000,
    !isAdmin && !isAttract,
  )

  // 키오스크 하드닝: 컨텍스트메뉴·핀치줌·드래그·뒤로가기 차단
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    const preventPinch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    const preventZoomWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault()
    }
    document.addEventListener('contextmenu', prevent)
    document.addEventListener('touchstart', preventPinch, { passive: false })
    document.addEventListener('wheel', preventZoomWheel, { passive: false })
    document.addEventListener('dragstart', prevent)
    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('touchstart', preventPinch)
      document.removeEventListener('wheel', preventZoomWheel)
      document.removeEventListener('dragstart', prevent)
    }
  }, [])

  // 키오스크 하드닝: 외장 키보드의 브라우저 단축키 차단 (관리자 화면 제외)
  useEffect(() => {
    if (isAdmin) return
    const onKeyDown = (e: KeyboardEvent) => {
      // 새로고침(F5, Ctrl+R)·전체화면 토글(F11)·브라우저 기능키
      if (e.key === 'F5' || e.key === 'F11' || e.key.startsWith('Browser')) {
        e.preventDefault()
        return
      }
      // Ctrl/Cmd 조합: 새로고침·인쇄·저장·찾기·새창/탭·확대축소 등
      if ((e.ctrlKey || e.metaKey) && 'rRpPsSfFnNtTwWoOuU+-=0'.includes(e.key)) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAdmin])

  // 키오스크 하드닝: 브라우저로 열었을 때 첫 터치에서 전체화면 진입, 풀리면 재진입
  // (PWA 전체화면 모드에서는 아무 동작 안 함)
  useEffect(() => {
    if (isAdmin) return
    const onPointerDown = () => {
      const standalone = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches
      if (!standalone && !document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {})
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isAdmin])

  // 안드로이드 뒤로가기 차단 (관리자 화면 제외)
  useEffect(() => {
    if (isAdmin) return
    // window.location.href 사용: 하위 경로(base) 배포에서도 전체 URL 유지
    history.pushState(null, '', window.location.href)
    const onPop = () => history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isAdmin, location.pathname])

  return (
    <div className={isAdmin ? 'h-full overflow-auto' : 'h-full crt'}>
      <Routes>
        <Route path="/" element={<AttractScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/mode" element={<ModeSelectScreen />} />
        <Route path="/game/rain" element={<GameRain />} />
        <Route path="/game/sentence" element={<GameSentence />} />
        <Route path="/game/long" element={<GameLong />} />
        <Route path="/result" element={<ResultScreen />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    startQueueAutoFlush()
    void refreshSentences()
  }, [])

  return (
    <SessionProvider>
      <KioskShell />
    </SessionProvider>
  )
}
