import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { saveParticipant } from '../lib/offlineQueue'
import { formatPhoneInput, isValidPhone, normalizePhone } from '../lib/util'

const CONSENT_TEXT = [
  ['수집 항목', '이름, 연락처(휴대전화번호)'],
  ['수집 목적', '경품 추첨 및 당첨 안내'],
  ['보유 기간', '행사 종료 후 30일 이내 파기'],
  ['거부 권리', '동의를 거부할 수 있으며, 거부 시 경품 응모 없이 게임 체험만 가능합니다'],
] as const

export default function RegisterScreen() {
  const navigate = useNavigate()
  const { setParticipant } = useSession()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (saving) return
    if (!name.trim()) return setError('이름을 입력해 주세요')
    if (!isValidPhone(phone)) return setError('연락처를 010-0000-0000 형식으로 입력해 주세요')
    if (!consent) return setError('개인정보 수집·이용 동의가 필요합니다')
    setError('')
    setSaving(true)
    const ref = await saveParticipant({
      name: name.trim(),
      phone: normalizePhone(phone),
      consent_at: new Date().toISOString(),
    })
    setParticipant({ ref, name: name.trim(), phone: normalizePhone(phone) })
    navigate('/mode')
  }

  const playAnonymous = () => {
    setParticipant(null)
    navigate('/mode')
  }

  return (
    <div className="h-full flex items-center justify-center px-8">
      <div className="w-full max-w-3xl border-2 border-cyan-500/60 neon-box rounded-2xl p-10 bg-slate-950/80">
        <h2 className="text-4xl text-cyan-300 neon-text mb-8 text-center">참가 등록</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <label className="block">
            <span className="text-slate-300 text-xl">이름</span>
            <input
              className="mt-2 w-full bg-slate-900 border-2 border-slate-600 focus:border-cyan-400 rounded-lg px-4 py-3 text-2xl outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={10}
              placeholder="홍길동"
            />
          </label>
          <label className="block">
            <span className="text-slate-300 text-xl">연락처</span>
            <input
              className="mt-2 w-full bg-slate-900 border-2 border-slate-600 focus:border-cyan-400 rounded-lg px-4 py-3 text-2xl outline-none tabular-nums"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              inputMode="numeric"
              placeholder="010-0000-0000"
            />
          </label>
        </div>

        <div className="border border-slate-700 rounded-lg p-4 mb-4 text-lg text-slate-400 space-y-1">
          <p className="text-slate-200 mb-2">개인정보 수집·이용 안내</p>
          {CONSENT_TEXT.map(([k, v]) => (
            <p key={k}>
              <span className="text-cyan-400">{k}</span> : {v}
            </p>
          ))}
        </div>

        <label className="flex items-center gap-3 text-xl mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="w-6 h-6 accent-cyan-400"
          />
          <span>위 개인정보 수집·이용에 동의합니다 (경품 응모 필수)</span>
        </label>

        {error && <p className="text-rose-400 text-xl mb-4">⚠ {error}</p>}

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => void submit()}
            disabled={saving}
            className="flex-1 py-4 text-2xl rounded-xl bg-cyan-500 text-slate-950 font-bold active:scale-95 transition disabled:opacity-50"
          >
            {saving ? '저장 중...' : '등록하고 시작하기 🎁'}
          </button>
          <button
            onClick={playAnonymous}
            className="flex-1 py-4 text-2xl rounded-xl border-2 border-slate-500 text-slate-300 active:scale-95 transition"
          >
            익명으로 체험만 (경품 제외)
          </button>
        </div>
      </div>
    </div>
  )
}
