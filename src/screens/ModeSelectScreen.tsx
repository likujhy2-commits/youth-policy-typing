import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { useIdleTimer } from '../hooks/useIdleTimer'
import { LONG_ENTRY_LIMIT, longEntriesLeft } from '../lib/entryLimit'
import { refreshSentences } from '../lib/sentences'

const MODES = [
  { key: 'rain', num: '1', title: '산성비', desc: '떨어지는 정책 키워드를 입력해 제거! 생명 5개, 60초', color: 'border-cyan-400 text-cyan-300' },
  { key: 'sentence', num: '2', title: '문장 타자', desc: '정책 문장을 60초 동안 최대한 많이 정확하게!', color: 'border-fuchsia-400 text-fuchsia-300' },
  { key: 'long', num: '3', title: '장문 챌린지', desc: '정책 안내문 한 문단을 90초 안에! 랭킹전 🏆', color: 'border-lime-400 text-lime-300' },
] as const

export default function ModeSelectScreen() {
  const navigate = useNavigate()
  const { participant, resetSession } = useSession()

  // 모드 선택 화면은 1분 무입력 시 처음 화면으로 (전역 90초보다 짧게)
  useIdleTimer(
    () => {
      resetSession()
      navigate('/')
    },
    60_000,
  )

  // 랭킹전 응모 제한: 등록 참가자만 카운트 (익명 체험은 응모 아님)
  const longLeft = participant ? longEntriesLeft(participant.phone) : null
  const longBlocked = longLeft !== null && longLeft <= 0

  useEffect(() => {
    void refreshSentences()
    const onKey = (e: KeyboardEvent) => {
      const m = MODES.find((m) => m.num === e.key)
      if (!m) return
      if (m.key === 'long' && longBlocked) return
      navigate(`/game/${m.key}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, longBlocked])

  return (
    <div className="relative h-full flex flex-col items-center justify-center gap-8 px-8">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-10 px-6 py-3 text-xl rounded-xl border-2 border-slate-600 text-slate-300 bg-slate-950/80 active:scale-95 transition hover:bg-slate-900"
      >
        ⌂ 처음으로
      </button>
      <h2 className="text-5xl text-cyan-300 neon-text">게임 모드 선택</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {MODES.map((m) => {
          const blocked = m.key === 'long' && longBlocked
          return (
            <button
              key={m.key}
              onClick={() => !blocked && navigate(`/game/${m.key}`)}
              disabled={blocked}
              className={`border-2 ${m.color} rounded-2xl p-10 bg-slate-950/80 text-left active:scale-95 transition hover:bg-slate-900 disabled:opacity-40 disabled:active:scale-100 disabled:hover:bg-slate-950/80`}
            >
              <p className="text-6xl mb-4">{m.num}️⃣</p>
              <p className={`text-4xl mb-4 neon-text`}>{m.title}</p>
              <p className="text-slate-400 text-xl leading-relaxed">{m.desc}</p>
              {m.key === 'long' && longLeft !== null && (
                <p className={`mt-3 text-xl ${blocked ? 'text-rose-400' : 'text-lime-300'}`}>
                  {blocked ? '응모 3회를 모두 사용했어요' : `남은 응모 ${longLeft}/${LONG_ENTRY_LIMIT}회`}
                </p>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-lime-300 text-2xl neon-text">🏆 랭킹전은 1인 당 응모 3번 가능합니다.</p>
      <p className="text-slate-500 text-xl">키보드 1 · 2 · 3 또는 터치로 선택하세요</p>
    </div>
  )
}
