import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DiffText from '../components/DiffText'
import Hud from '../components/Hud'
import { useSession } from '../context/SessionContext'
import { useTypingEngine } from '../hooks/useTypingEngine'
import { sfx } from '../lib/audio'
import { jamoCount } from '../lib/hangul/jamo'
import { getSentences } from '../lib/sentences'

const DURATION = 90

export default function GameLong() {
  const navigate = useNavigate()
  const { setResult } = useSession()

  const [target, setTarget] = useState('')
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const endedRef = useRef(false)
  const startRef = useRef(performance.now())

  useEffect(() => {
    const paragraphs = getSentences(3)
    setTarget(paragraphs[Math.floor(Math.random() * paragraphs.length)] ?? '')
    startRef.current = performance.now()
  }, [])

  const engine = useTypingEngine({
    enabled: true,
    onKeystroke: () => sfx.key(),
  })

  const engineRef = useRef(engine)
  engineRef.current = engine
  const targetRef = useRef(target)
  targetRef.current = target

  const finish = useCallback(() => {
    if (endedRef.current) return
    endedRef.current = true
    sfx.end()
    const typed = engineRef.current.takeAndClear()
    const targetChars = [...targetRef.current]
    const typedChars = [...typed]
    let correctJamo = 0
    for (let i = 0; i < Math.min(targetChars.length, typedChars.length); i++) {
      if (typedChars[i] === targetChars[i]) correctJamo += jamoCount(targetChars[i])
    }
    const elapsed = Math.max(1, Math.min(DURATION, (performance.now() - startRef.current) / 1000))
    const cpm = Math.round((correctJamo / elapsed) * 60)
    const ks = engineRef.current.keystrokes()
    const accuracy = ks > 0 ? Math.min(100, Math.round((correctJamo / ks) * 1000) / 10) : 100
    // 랭킹전: 타수·정확도 종합 점수
    const score = Math.round(cpm * (accuracy / 100))
    setResult({ mode: 'long', score, cpm, accuracy })
    navigate('/result')
  }, [navigate, setResult])

  // 문단 완주 시 조기 종료
  const { committed } = engine
  useEffect(() => {
    if (target && [...committed].length >= [...target].length) finish()
  }, [committed, target, finish])

  useEffect(() => {
    const t = setInterval(() => {
      const remaining = DURATION - (performance.now() - startRef.current) / 1000
      setTimeLeft(remaining)
      if (remaining <= 0) finish()
    }, 100)
    return () => clearInterval(t)
  }, [finish])

  // 실시간 통계 (완주 전 진행분 기준)
  const targetChars = [...target]
  const typedChars = [...engine.committed]
  let liveCorrect = 0
  for (let i = 0; i < Math.min(targetChars.length, typedChars.length); i++) {
    if (typedChars[i] === targetChars[i]) liveCorrect += jamoCount(targetChars[i])
  }
  const elapsed = Math.max(0.001, (performance.now() - startRef.current) / 1000)
  const cpm = (liveCorrect / elapsed) * 60
  const ks = engine.keystrokes()
  const accuracy = ks > 0 ? Math.min(100, (liveCorrect / ks) * 100) : 100
  const progress = target ? Math.min(100, (typedChars.length / targetChars.length) * 100) : 0

  return (
    <div className="h-full flex flex-col">
      <Hud timeLeft={timeLeft} cpm={cpm} accuracy={accuracy} hangulMode={engine.hangulMode} />

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-4 gap-5 min-h-0">
        <p className="text-lime-300 text-xl neon-text shrink-0">🏆 장문 챌린지 — 랭킹전</p>
        {/* 장문 전체가 화면에 보이도록 작은 글씨 + 세로 여유, 넘치면 스크롤 */}
        <div className="w-full max-w-7xl border-2 border-lime-500/50 rounded-2xl px-8 py-6 bg-slate-950/80 overflow-y-auto min-h-0">
          <DiffText
            target={target}
            committed={engine.committed}
            composing={engine.composing}
            sizeClass="text-xl md:text-2xl"
          />
        </div>
        <div className="w-full max-w-7xl h-3 bg-slate-800 rounded-full overflow-hidden shrink-0">
          <div className="h-full bg-lime-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
