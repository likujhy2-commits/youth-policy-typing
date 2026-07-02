import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { todayStartISO } from '../lib/util'
import { MODE_LABEL, type GameMode } from '../lib/score'

interface Row {
  id: string
  mode: GameMode
  score: number
  cpm: number
  accuracy: number
  created_at: string
  participants: { name: string } | null
}

export default function Records() {
  const [rows, setRows] = useState<Row[]>([])
  const [mode, setMode] = useState<GameMode | 'all'>('all')

  const load = async () => {
    if (!supabase) return
    let q = supabase
      .from('plays')
      .select('id, mode, score, cpm, accuracy, created_at, participants(name)')
      .gte('created_at', todayStartISO())
      .order('score', { ascending: false })
      .limit(300)
    if (mode !== 'all') q = q.eq('mode', mode)
    const { data } = await q
    setRows((data as unknown as Row[]) ?? [])
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const remove = async (id: string) => {
    if (!supabase || !confirm('이 기록을 삭제할까요? 랭킹에서 제거됩니다.')) return
    await supabase.from('plays').delete().eq('id', id)
    void load()
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">기록 관리 (오늘, 점수순)</h2>
      <div className="flex gap-2 mb-4">
        {(['all', 'rain', 'sentence', 'long'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded text-sm ${mode === m ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400 border border-slate-700'}`}
          >
            {m === 'all' ? '전체' : MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-sm">
            <th className="py-2">참가자</th>
            <th>모드</th>
            <th>점수</th>
            <th>타수</th>
            <th>정확도</th>
            <th>시각</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-800 tabular-nums">
              <td className="py-2">{r.participants?.name ?? '익명'}</td>
              <td>{MODE_LABEL[r.mode]}</td>
              <td className="font-bold text-cyan-300">{r.score.toLocaleString()}</td>
              <td>{r.cpm}</td>
              <td>{r.accuracy}%</td>
              <td className="text-slate-400 text-sm">{new Date(r.created_at).toLocaleTimeString('ko-KR')}</td>
              <td className="text-right">
                <button onClick={() => void remove(r.id)} className="text-rose-400 hover:underline text-sm">
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-slate-500 py-8 text-center">오늘 기록이 없습니다</p>}
    </div>
  )
}
