import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Row {
  id: string
  level: number
  text: string
  is_active: boolean
}

const LEVEL_LABEL: Record<number, string> = { 1: '키워드 (산성비)', 2: '문장', 3: '장문' }

/** 산성비(레벨 1) 낱말은 스페이스가 "제출" 키라 공백이 있으면 맞출 수 없다 */
function validateText(level: number, text: string): string | null {
  if (level === 1 && /\s/.test(text)) {
    return '산성비 키워드에는 띄어쓰기를 넣을 수 없어요 (스페이스가 제출 키라서 맞출 수 없게 됩니다)'
  }
  return null
}

export default function Sentences() {
  const [rows, setRows] = useState<Row[]>([])
  const [level, setLevel] = useState(1)
  const [text, setText] = useState('')
  const [filter, setFilter] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const load = async () => {
    if (!supabase) return
    const { data } = await supabase.from('sentences').select('*').order('level').order('text')
    setRows((data as Row[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  const add = async () => {
    if (!supabase || !text.trim()) return
    const err = validateText(level, text.trim())
    if (err) return alert(err)
    await supabase.from('sentences').insert({ level, text: text.trim(), is_active: true })
    setText('')
    void load()
  }

  const startEdit = (row: Row) => {
    setEditingId(row.id)
    setEditText(row.text)
  }

  const saveEdit = async (row: Row) => {
    if (!supabase || !editText.trim()) return
    const err = validateText(row.level, editText.trim())
    if (err) return alert(err)
    const { error } = await supabase.from('sentences').update({ text: editText.trim() }).eq('id', row.id)
    if (error) alert(`저장 실패: ${error.message}`)
    setEditingId(null)
    void load()
  }

  const toggle = async (row: Row) => {
    if (!supabase) return
    const { error } = await supabase.from('sentences').update({ is_active: !row.is_active }).eq('id', row.id)
    if (error) alert(`변경 실패: ${error.message}`)
    void load()
  }

  const remove = async (id: string) => {
    if (!supabase || !confirm('이 문장을 삭제할까요?')) return
    const { data, error } = await supabase.from('sentences').delete().eq('id', id).select('id')
    if (error || !data?.length) {
      alert(error ? `삭제 실패: ${error.message}` : '삭제되지 않았습니다. 로그아웃 후 다시 로그인해서 시도해 보세요.')
    }
    void load()
  }

  const visible = filter === 0 ? rows : rows.filter((r) => r.level === filter)

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">문장 관리</h2>
      <p className="text-sm text-slate-500 mb-4">
        변경 사항은 키오스크가 온라인일 때 게임 시작 시 자동 반영됩니다.
      </p>

      <div className="flex gap-3 mb-6 items-start flex-wrap">
        <select
          className="bg-slate-900 border border-slate-600 rounded px-3 py-2"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
        >
          {[1, 2, 3].map((l) => (
            <option key={l} value={l}>
              레벨 {l} — {LEVEL_LABEL[l]}
            </option>
          ))}
        </select>
        <textarea
          className="flex-1 min-w-64 bg-slate-900 border border-slate-600 rounded px-3 py-2"
          rows={2}
          placeholder="새 문장/키워드 입력"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={() => void add()} className="px-4 py-2 rounded bg-cyan-500 text-slate-950 font-bold">
          추가
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[0, 1, 2, 3].map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`px-3 py-1 rounded text-sm ${filter === l ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400 border border-slate-700'}`}
          >
            {l === 0 ? '전체' : `레벨 ${l}`}
          </button>
        ))}
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-sm">
            <th className="py-2 w-20">레벨</th>
            <th>내용</th>
            <th className="w-20">상태</th>
            <th className="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.id} className={`border-b border-slate-800 ${r.is_active ? '' : 'opacity-40'}`}>
              <td className="py-2">Lv.{r.level}</td>
              <td className="pr-4">
                {editingId === r.id ? (
                  <textarea
                    className="w-full bg-slate-900 border border-cyan-500 rounded px-2 py-1"
                    rows={r.level === 3 ? 4 : 2}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                  />
                ) : (
                  r.text
                )}
              </td>
              <td>
                <button
                  onClick={() => void toggle(r)}
                  className={`text-sm px-2 py-0.5 rounded ${r.is_active ? 'bg-lime-500/20 text-lime-300' : 'bg-slate-700 text-slate-400'}`}
                >
                  {r.is_active ? '활성' : '비활성'}
                </button>
              </td>
              <td className="text-right whitespace-nowrap">
                {editingId === r.id ? (
                  <>
                    <button onClick={() => void saveEdit(r)} className="text-lime-300 hover:underline text-sm mr-3">
                      저장
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:underline text-sm">
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)} className="text-cyan-300 hover:underline text-sm mr-3">
                      수정
                    </button>
                    <button onClick={() => void remove(r.id)} className="text-rose-400 hover:underline text-sm">
                      삭제
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 && <p className="text-slate-500 py-8 text-center">문장이 없습니다</p>}
    </div>
  )
}
