import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import QrCode from '../components/QrCode'
import { useSession } from '../context/SessionContext'
import { addLocalPlay, getTodayRanking, gradeFor, MODE_LABEL, type RankEntry } from '../lib/score'
import { savePlay } from '../lib/offlineQueue'
import { addLongEntry } from '../lib/entryLimit'

// ||를 사용: CI에서 변수가 비어있으면 빈 문자열이 들어와 ??로는 못 거른다 (QR 생성 실패 원인)
const QR_LINKS = [
  { url: (import.meta.env.VITE_APPLY_URL as string | undefined) || 'https://gjyouthdream.com', label: '일경험드림 신청' },
  { url: (import.meta.env.VITE_APPLY_URL2 as string | undefined) || 'https://kjcareer.co.kr', label: '국제커리어' },
]
const AUTO_RETURN_SEC = 30

export default function ResultScreen() {
  const navigate = useNavigate()
  const { participant, result } = useSession()
  const [ranking, setRanking] = useState<RankEntry[]>([])
  const [countdown, setCountdown] = useState(AUTO_RETURN_SEC)
  const savedRef = useRef(false)

  useEffect(() => {
    if (!result || savedRef.current) return
    savedRef.current = true
    const play = { ...result, created_at: new Date().toISOString() }
    // 랭킹전(장문)은 등록 참가자 기준 응모 1회 차감
    if (result.mode === 'long' && participant) addLongEntry(participant.phone)
    addLocalPlay(play, participant?.name ?? null)
    void savePlay(play, participant?.ref ?? null).then(() => getTodayRanking(result.mode).then(setRanking))
  }, [result, participant])

  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (countdown <= 0) navigate('/')
  }, [countdown, navigate])

  if (!result) return <Navigate to="/" replace />

  const grade = gradeFor(result.cpm)

  return (
    <div className="h-full flex items-center justify-center gap-12 px-10">
      {/* 좌: 내 결과 */}
      <div className="flex-1 max-w-xl text-center">
        <p className="text-slate-400 text-2xl mb-2">{MODE_LABEL[result.mode]} 결과</p>
        <p className="text-7xl mb-3">{grade.emoji}</p>
        <p className="text-4xl text-fuchsia-300 neon-text mb-8">{grade.title}</p>

        <p className="text-8xl text-cyan-300 neon-text tabular-nums mb-6">{result.score.toLocaleString()}</p>
        <div className="flex justify-center gap-10 text-2xl mb-10">
          <span className="text-lime-300">{result.cpm} 타/분</span>
          <span className="text-fuchsia-300">정확도 {result.accuracy}%</span>
        </div>

        <div className="flex justify-center gap-4">
          {QR_LINKS.map((q) => (
            <div key={q.url} className="flex flex-col items-center gap-2 border-2 border-cyan-500/60 rounded-2xl p-4 bg-white/95">
              <QrCode url={q.url} size={120} />
              <p className="text-slate-900 text-lg font-bold">📱 {q.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 우: 오늘의 랭킹 */}
      <div className="w-96 border-2 border-slate-700 rounded-2xl p-6 bg-slate-950/80">
        <h3 className="text-2xl text-yellow-300 neon-text mb-4 text-center">🏆 최근 3일 TOP 10</h3>
        <ol className="space-y-2 text-xl">
          {ranking.length === 0 && <p className="text-slate-500 text-center py-6">아직 기록이 없어요</p>}
          {ranking.map((r, i) => (
            <li key={i} className="flex justify-between tabular-nums">
              <span>
                <span className={i < 3 ? 'text-yellow-300' : 'text-slate-500'}>{i + 1}.</span>{' '}
                <span className="text-slate-200">{r.name}</span>
              </span>
              <span className="text-cyan-300">{r.score.toLocaleString()}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/mode')}
            className="flex-1 py-3 text-xl rounded-lg bg-cyan-500 text-slate-950 font-bold active:scale-95"
          >
            다시 하기
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 text-xl rounded-lg border-2 border-slate-600 text-slate-300 active:scale-95"
          >
            처음으로 ({Math.max(0, countdown)})
          </button>
        </div>
      </div>
    </div>
  )
}
