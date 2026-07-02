import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import Dashboard from './Dashboard'
import Participants from './Participants'
import Draw from './Draw'
import Sentences from './Sentences'
import Records from './Records'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const login = async () => {
    if (!supabase) return
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('로그인 실패: ' + error.message)
    setBusy(false)
  }

  return (
    <div className="min-h-full flex items-center justify-center">
      <form
        className="w-full max-w-sm border border-slate-700 rounded-xl p-8 bg-slate-950"
        onSubmit={(e) => {
          e.preventDefault()
          void login()
        }}
      >
        <h1 className="text-2xl text-cyan-300 mb-6">관리자 로그인</h1>
        <input
          className="w-full mb-3 bg-slate-900 border border-slate-600 rounded px-3 py-2"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full mb-4 bg-slate-900 border border-slate-600 rounded px-3 py-2"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-rose-400 mb-3 text-sm">{error}</p>}
        <button disabled={busy} className="w-full py-2 rounded bg-cyan-500 text-slate-950 font-bold disabled:opacity-50">
          {busy ? '확인 중...' : '로그인'}
        </button>
      </form>
    </div>
  )
}

const NAV = [
  { to: '/admin', label: '대시보드', end: true },
  { to: '/admin/participants', label: '참가자' },
  { to: '/admin/draw', label: '경품 추첨' },
  { to: '/admin/sentences', label: '문장 관리' },
  { to: '/admin/records', label: '기록 관리' },
] as const

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-2xl text-amber-300 mb-4">⚠ Supabase가 설정되지 않았습니다</p>
          <p className="text-slate-400">
            .env에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 설정하면
            <br />
            관리자 기능(참가자·추첨·문장 관리)을 사용할 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="p-10 text-slate-400">불러오는 중...</div>
  if (!session) return <Login />

  return (
    <div className="min-h-full text-base" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header className="flex items-center gap-6 px-6 py-3 border-b border-slate-700 bg-slate-950 sticky top-0 z-10">
        <span className="text-cyan-300 font-bold">타자게임 관리자</span>
        <nav className="flex gap-4">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={'end' in n && n.end}
              className={({ isActive }) =>
                `px-2 py-1 rounded ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="ml-auto text-slate-400 hover:text-rose-400"
          onClick={() => void supabase?.auth.signOut()}
        >
          로그아웃
        </button>
      </header>
      <main className="p-6 max-w-6xl mx-auto">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="participants" element={<Participants />} />
          <Route path="draw" element={<Draw />} />
          <Route path="sentences" element={<Sentences />} />
          <Route path="records" element={<Records />} />
        </Routes>
      </main>
    </div>
  )
}
