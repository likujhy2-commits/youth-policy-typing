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

  // 90초 무입력 → 어트랙트 복귀 + 세션 초기화 (관리자·어트랙트 화면 제외)
  useIdleTimer(
    () => {
      resetSession()
      navigate('/')
    },
    90_000,
    !isAdmin && !isAttract,
  )

  // 키오스크 하드닝: 컨텍스트메뉴·핀치줌·뒤로가기 차단
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
    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('touchstart', preventPinch)
      document.removeEventListener('wheel', preventZoomWheel)
    }
  }, [])

  // 안드로이드 뒤로가기 차단 (관리자 화면 제외)
  useEffect(() => {
    if (isAdmin) return
    history.pushState(null, '', location.pathname)
    const onPop = () => history.pushState(null, '', location.pathname)
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
