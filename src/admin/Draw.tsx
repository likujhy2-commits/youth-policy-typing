import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { maskPhone, shuffle } from '../lib/util'

interface Participant {
  id: string
  name: string
  phone: string
}

interface DrawRow {
  id: string
  prize: string
  drawn_at: string
  participants: { name: string; phone: string } | null
}

export default function Draw() {
  const [count, setCount] = useState(3)
  const [prize, setPrize] = useState('경품')
  const [excludeWinners, setExcludeWinners] = useState(true)
  const [winners, setWinners] = useState<Participant[]>([])
  const [history, setHistory] = useState<DrawRow[]>([])
  const [busy, setBusy] = useState(false)

  const loadHistory = async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('draws')
      .select('id, prize, drawn_at, participants(name, phone)')
      .order('drawn_at', { ascending: false })
      .limit(100)
    setHistory((data as unknown as DrawRow[]) ?? [])
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  const runDraw = async () => {
    if (!supabase || busy) return
    setBusy(true)
    try {
      const { data: participants } = await supabase.from('participants').select('id, name, phone')
      if (!participants || participants.length === 0) {
        alert('참가자가 없습니다')
        return
      }

      // 연락처 기준 1인 1응모 (중복 제거, 먼저 등록한 건 기준)
      const byPhone = new Map<string, Participant>()
      for (const p of participants as Participant[]) {
        if (!byPhone.has(p.phone)) byPhone.set(p.phone, p)
      }
      let pool = [...byPhone.values()]

      if (excludeWinners) {
        const { data: prev } = await supabase.from('draws').select('participant_id')
        const prevIds = new Set((prev ?? []).map((d) => d.participant_id))
        pool = pool.filter((p) => !prevIds.has(p.id))
      }

      if (pool.length === 0) {
        alert('추첨 가능한 대상이 없습니다')
        return
      }

      const picked = shuffle(pool).slice(0, Math.max(1, count))
      const { error } = await supabase.from('draws').insert(
        picked.map((p) => ({ participant_id: p.id, prize, drawn_at: new Date().toISOString() })),
      )
      if (error) {
        alert('추첨 결과 저장 실패: ' + error.message)
        return
      }
      setWinners(picked)
      void loadHistory()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">경품 추첨</h2>
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <label className="block">
          <span className="text-sm text-slate-400">경품명</span>
          <input
            className="block bg-slate-900 border border-slate-600 rounded px-3 py-1.5 w-48"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">인원수</span>
          <input
            type="number"
            min={1}
            className="block bg-slate-900 border border-slate-600 rounded px-3 py-1.5 w-24"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            checked={excludeWinners}
            onChange={(e) => setExcludeWinners(e.target.checked)}
          />
          <span className="text-sm">기당첨자 제외</span>
        </label>
        <button
          onClick={() => void runDraw()}
          disabled={busy}
          className="px-5 py-2 rounded bg-fuchsia-500 text-slate-950 font-bold disabled:opacity-50"
        >
          {busy ? '추첨 중...' : '🎲 추첨 실행'}
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6">연락처 기준 1인 1응모로 중복이 자동 제거됩니다.</p>

      {winners.length > 0 && (
        <div className="border-2 border-fuchsia-500 rounded-lg p-5 mb-8 bg-fuchsia-950/30">
          <h3 className="font-bold text-fuchsia-300 mb-3">🎉 당첨자 ({prize})</h3>
          <ul className="space-y-1 text-lg">
            {winners.map((w) => (
              <li key={w.id}>
                {w.name} <span className="text-slate-400 tabular-nums">{w.phone}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="font-bold mb-3">추첨 이력</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-sm">
            <th className="py-2">경품</th>
            <th>당첨자</th>
            <th>연락처</th>
            <th>추첨 시각</th>
          </tr>
        </thead>
        <tbody>
          {history.map((d) => (
            <tr key={d.id} className="border-b border-slate-800">
              <td className="py-2">{d.prize}</td>
              <td>{d.participants?.name ?? '(삭제됨)'}</td>
              <td className="tabular-nums">{d.participants ? maskPhone(d.participants.phone) : '-'}</td>
              <td className="text-slate-400 text-sm">{new Date(d.drawn_at).toLocaleString('ko-KR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {history.length === 0 && <p className="text-slate-500 py-8 text-center">추첨 이력이 없습니다</p>}
    </div>
  )
}
