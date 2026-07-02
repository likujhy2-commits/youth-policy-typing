import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { DEFAULT_SENTENCES } from '../lib/sentences'

const KEYWORDS = DEFAULT_SENTENCES[1]

/** 대기 화면: 번인 방지 겸 호객용 애니메이션 루프 */
export default function AttractScreen() {
  const navigate = useNavigate()
  const { resetSession } = useSession()

  useEffect(() => {
    resetSession()
    const start = () => navigate('/register')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F5' || e.ctrlKey || e.metaKey) return
      start()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', start)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', start)
    }
  }, [navigate, resetSession])

  return (
    <div className="h-full flex flex-col items-center justify-center gap-12 relative overflow-hidden">
      {/* 떠다니는 정책 키워드 */}
      {KEYWORDS.map((w, i) => (
        <span
          key={w}
          className="absolute text-cyan-500/30 text-2xl md:text-4xl animate-float"
          style={{
            left: `${(i * 37 + 8) % 85}%`,
            top: `${(i * 53 + 10) % 80}%`,
            animationDelay: `${i * 0.45}s`,
          }}
        >
          {w}
        </span>
      ))}

      <div className="text-center z-10">
        <p className="text-fuchsia-400 text-2xl md:text-3xl mb-6 neon-text">광주 청년일경험드림사업</p>
        <h1 className="text-6xl md:text-8xl text-cyan-300 neon-text mb-4">청년정책 타자게임</h1>
        <p className="text-slate-400 text-xl md:text-2xl">타닥타닥, 내 커리어가 시작되는 소리</p>
      </div>

      <p className="text-3xl md:text-5xl text-lime-300 neon-text animate-blink z-10">
        ▶ 아무 키나 눌러 시작하세요 ◀
      </p>

      <p className="absolute bottom-6 text-slate-600 text-lg">경품 추첨 참여 가능 · 무료 체험</p>
    </div>
  )
}
