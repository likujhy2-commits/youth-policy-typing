import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { refreshSentences } from '../lib/sentences'

const MODES = [
  { key: 'rain', num: '1', title: '산성비', desc: '떨어지는 정책 키워드를 입력해 제거! 생명 5개, 60초', color: 'border-cyan-400 text-cyan-300' },
  { key: 'sentence', num: '2', title: '문장 타자', desc: '정책 문장을 60초 동안 최대한 많이 정확하게!', color: 'border-fuchsia-400 text-fuchsia-300' },
  { key: 'long', num: '3', title: '장문 챌린지', desc: '정책 안내문 한 문단을 90초 안에! 랭킹전 🏆', color: 'border-lime-400 text-lime-300' },
] as const

export default function ModeSelectScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    void refreshSentences()
    const onKey = (e: KeyboardEvent) => {
      const m = MODES.find((m) => m.num === e.key)
      if (m) navigate(`/game/${m.key}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <div className="h-full flex flex-col items-center justify-center gap-12 px-8">
      <h2 className="text-5xl text-cyan-300 neon-text">게임 모드 선택</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => navigate(`/game/${m.key}`)}
            className={`border-2 ${m.color} rounded-2xl p-10 bg-slate-950/80 text-left active:scale-95 transition hover:bg-slate-900`}
          >
            <p className="text-6xl mb-4">{m.num}️⃣</p>
            <p className={`text-4xl mb-4 neon-text`}>{m.title}</p>
            <p className="text-slate-400 text-xl leading-relaxed">{m.desc}</p>
          </button>
        ))}
      </div>
      <p className="text-slate-500 text-xl">키보드 1 · 2 · 3 또는 터치로 선택하세요</p>
    </div>
  )
}
