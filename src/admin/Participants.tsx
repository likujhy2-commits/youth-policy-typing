import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Row {
  id: string
  name: string
  phone: string
  consent_at: string
  created_at: string
}

export default function Participants() {
  const [rows, setRows] = useState<Row[]>([])
  const [query, setQuery] = useState('')
  const [purgeConfirm, setPurgeConfirm] = useState('')
  const [showPurge, setShowPurge] = useState(false)

  const load = async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)
    setRows((data as Row[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = rows.filter(
    (r) => r.name.includes(query) || r.phone.includes(query.replace(/\D/g, '') || query),
  )

  const exportCsv = () => {
    const header = '이름,연락처,동의시각,등록시각\n'
    const body = filtered
      .map((r) => `${r.name},${r.phone},${r.consent_at},${r.created_at}`)
      .join('\n')
    // UTF-8 BOM: 엑셀 한글 호환
    const blob = new Blob(['﻿' + header + body], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `참가자_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const removeOne = async (id: string) => {
    if (!supabase || !confirm('이 참가자를 삭제(파기)할까요? 플레이 기록의 연결도 해제됩니다.')) return
    // .select()로 실제 삭제된 행을 돌려받아 0건(권한 만료 등 조용한 실패)을 감지
    const { data, error } = await supabase.from('participants').delete().eq('id', id).select('id')
    if (error || !data?.length) {
      alert(error ? `삭제 실패: ${error.message}` : '삭제되지 않았습니다. 로그아웃 후 다시 로그인해서 시도해 보세요.')
    }
    void load()
  }

  const purgeAll = async () => {
    if (!supabase || purgeConfirm !== '파기') return
    const { error: e1 } = await supabase.from('draws').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error: e2 } = await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setShowPurge(false)
    setPurgeConfirm('')
    void load()
    const err = e1 ?? e2
    alert(err ? `파기 실패: ${err.message} — 로그아웃 후 다시 로그인해서 시도해 보세요.` : '전체 개인정보가 파기되었습니다.')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 className="text-xl font-bold">참가자 ({rows.length}명)</h2>
        <input
          className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 w-64"
          placeholder="이름/연락처 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={exportCsv} className="px-3 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold">
          CSV 다운로드
        </button>
        <button
          onClick={() => setShowPurge(true)}
          className="ml-auto px-3 py-1.5 rounded bg-rose-600 text-white font-bold"
        >
          전체 파기
        </button>
      </div>

      {showPurge && (
        <div className="border-2 border-rose-500 rounded-lg p-4 mb-4 bg-rose-950/40">
          <p className="mb-2 font-bold text-rose-300">
            ⚠ 참가자 {rows.length}명의 개인정보와 추첨 기록을 영구 삭제합니다. 되돌릴 수 없습니다.
          </p>
          <p className="mb-2 text-sm text-slate-300">확인을 위해 아래에 <b>파기</b> 라고 입력하세요.</p>
          <div className="flex gap-2">
            <input
              className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5"
              value={purgeConfirm}
              onChange={(e) => setPurgeConfirm(e.target.value)}
            />
            <button
              disabled={purgeConfirm !== '파기'}
              onClick={() => void purgeAll()}
              className="px-3 py-1.5 rounded bg-rose-600 text-white font-bold disabled:opacity-40"
            >
              영구 파기 실행
            </button>
            <button onClick={() => setShowPurge(false)} className="px-3 py-1.5 rounded border border-slate-600">
              취소
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-sm">
            <th className="py-2">이름</th>
            <th>연락처</th>
            <th>등록 시각</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-b border-slate-800">
              <td className="py-2">{r.name}</td>
              <td className="tabular-nums">{r.phone}</td>
              <td className="text-slate-400 text-sm">{new Date(r.created_at).toLocaleString('ko-KR')}</td>
              <td className="text-right">
                <button onClick={() => void removeOne(r.id)} className="text-rose-400 hover:underline text-sm">
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-slate-500 py-8 text-center">데이터가 없습니다</p>}
    </div>
  )
}
