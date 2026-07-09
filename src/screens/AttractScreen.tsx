import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

// 대기 화면에 은은하게 띄울 대표 키워드 (전체 낱말을 쓰면 화면이 난잡해짐)
// 중앙 문구를 가리지 않도록 위·아래 가장자리에만 배치
const KEYWORDS: Array<{ text: string; left: number; top: number }> = [
  { text: '일경험드림', left: 6, top: 6 },
  { text: '커리어', left: 38, top: 10 },
  { text: '드림터', left: 60, top: 5 },
  { text: '광주청년', left: 78, top: 11 },
  { text: '인재채움뱅크', left: 6, top: 83 },
  { text: '구직활동수당', left: 32, top: 88 },
  { text: '취업성공', left: 58, top: 82 },
  { text: '미래내일일경험', left: 67, top: 88 },
]

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
          key={w.text}
          className="absolute text-cyan-500/15 text-2xl md:text-3xl animate-float whitespace-nowrap"
          style={{
            left: `${w.left}%`,
            top: `${w.top}%`,
            animationDelay: `${i * 0.45}s`,
          }}
        >
          {w.text}
        </span>
      ))}

      <div className="text-center z-10">
        <p className="text-fuchsia-400 text-2xl md:text-3xl mb-6 neon-text">
          광주청년 일경험드림 사업 <span className="text-slate-400">x</span> 주식회사 국제커리어
        </p>
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
