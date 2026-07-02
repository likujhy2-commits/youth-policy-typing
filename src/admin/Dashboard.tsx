import { useEffect, useState } from 'react'
import { flushQueue, pendingCount } from '../lib/offlineQueue'
import { supabase } from '../lib/supabase'
import { todayStartISO } from '../lib/util'

export default function Dashboard() {
  const [playsToday, setPlaysToday] = useState(0)
  const [participantsToday, setParticipantsToday] = useState(0)
  const [avgScore, setAvgScore] = useState(0)
  const [hourly, setHourly] = useState<number[]>(Array(24).fill(0))
  const [pending, setPending] = useState(pendingCount())
  const [flushing, setFlushing] = useState(false)

  const load = async () => {
    if (!supabase) return
    const since = todayStartISO()
    const [{ count: pc }, { count: uc }, { data: plays }] = await Promise.all([
      supabase.from('plays').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('participants').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('plays').select('score, created_at').gte('created_at', since).limit(2000),
    ])
    setPlaysToday(pc ?? 0)
    setParticipantsToday(uc ?? 0)
    if (plays && plays.length > 0) {
      setAvgScore(Math.round(plays.reduce((a, p) => a + p.score, 0) / plays.length))
      const buckets = Array(24).fill(0)
      for (const p of plays) buckets[new Date(p.created_at).getHours()]++
      setHourly(buckets)
    }
    setPending(pendingCount())
  }

  useEffect(() => {
    void load()
    const t = setInterval(() => void load(), 30_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const max = Math.max(1, ...hourly)

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">대시보드 (오늘)</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ['총 플레이', playsToday],
          ['등록 참가자', participantsToday],
          ['평균 점수', avgScore],
          ['미전송 큐', pending],
        ].map(([label, value]) => (
          <div key={label} className="border border-slate-700 rounded-lg p-4 bg-slate-950">
            <p className="text-slate-400 text-sm">{label}</p>
            <p className={`text-3xl font-bold ${label === '미전송 큐' && Number(value) > 0 ? 'text-amber-300' : 'text-cyan-300'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {pending > 0 && (
        <button
          disabled={flushing}
          onClick={async () => {
            setFlushing(true)
            await flushQueue()
            setPending(pendingCount())
            setFlushing(false)
            void load()
          }}
          className="mb-8 px-4 py-2 rounded bg-amber-500 text-slate-950 font-bold disabled:opacity-50"
        >
          {flushing ? '전송 중...' : '미전송 큐 지금 재전송'}
        </button>
      )}

      <h3 className="text-lg font-bold mb-3">시간대별 참여</h3>
      <div className="flex items-end gap-1 h-40 border border-slate-700 rounded-lg p-4 bg-slate-950">
        {hourly.map((n, h) => (
          <div key={h} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-slate-500">{n > 0 ? n : ''}</span>
            <div className="w-full bg-cyan-500/70 rounded-t" style={{ height: `${(n / max) * 100}%` }} />
            <span className="text-[10px] text-slate-600">{h}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
