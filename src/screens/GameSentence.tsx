import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DiffText from '../components/DiffText'
import Hud from '../components/Hud'
import { useSession } from '../context/SessionContext'
import { useTypingEngine } from '../hooks/useTypingEngine'
import { sfx } from '../lib/audio'
import { jamoCount } from '../lib/hangul/jamo'
import { getSentences } from '../lib/sentences'
import { shuffle } from '../lib/util'

const DURATION = 60

export default function GameSentence() {
  const navigate = useNavigate()
  const { setResult } = useSession()

  const [sentences, setSentences] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const correctJamoRef = useRef(0)
  const doneCountRef = useRef(0)
  const endedRef = useRef(false)
  const startRef = useRef(performance.now())

  useEffect(() => {
    setSentences(shuffle(getSentences(2)))
    startRef.current = performance.now()
  }, [])

  const target = sentences[idx % Math.max(1, sentences.length)] ?? ''

  const scoreTyped = useCallback(
    (typed: string) => {
      const targetChars = [...target]
      const typedChars = [...typed]
      for (let i = 0; i < Math.min(targetChars.length, typedChars.length); i++) {
        if (typedChars[i] === targetChars[i]) correctJamoRef.current += jamoCount(targetChars[i])
      }
    },
    [target],
  )

  const engineRef = useRef<{ takeAndClear: () => string; keystrokes: () => number } | null>(null)

  const advance = useCallback(
    (typed: string) => {
      if (!target) return
      scoreTyped(typed)
      doneCountRef.current++
      sfx.clear()
      setIdx((i) => i + 1)
    },
    [scoreTyped, target],
  )

  const engine = useTypingEngine({
    enabled: true,
    onSubmit: (typed) => advance(typed),
    onKeystroke: () => sfx.key(),
  })
  engineRef.current = engine

  const finish = useCallback(() => {
    if (endedRef.current) return
    endedRef.current = true
    sfx.end()
    // 진행 중이던 문장의 정타분도 반영
    const leftover = engineRef.current?.takeAndClear() ?? ''
    if (leftover) scoreTyped(leftover)
    const elapsed = Math.max(1, Math.min(DURATION, (performance.now() - startRef.current) / 1000))
    const cpm = Math.round((correctJamoRef.current / elapsed) * 60)
    const ks = engineRef.current?.keystrokes() ?? 0
    const accuracy = ks > 0 ? Math.min(100, Math.round((correctJamoRef.current / ks) * 1000) / 10) : 100
    setResult({ mode: 'sentence', score: correctJamoRef.current, cpm, accuracy })
    navigate('/result')
  }, [navigate, scoreTyped, setResult])

  // 문장 끝까지 입력하면 자동 다음 문장
  const { committed, takeAndClear } = engine
  const advanceRef = useRef(advance)
  advanceRef.current = advance
  const takeRef = useRef(takeAndClear)
  takeRef.current = takeAndClear
  useEffect(() => {
    if (target && [...committed].length >= [...target].length) {
      advanceRef.current(takeRef.current())
    }
  }, [committed, target])

  // 타이머
  useEffect(() => {
    const t = setInterval(() => {
      const remaining = DURATION - (performance.now() - startRef.current) / 1000
      setTimeLeft(remaining)
      if (remaining <= 0) finish()
    }, 100)
    return () => clearInterval(t)
  }, [finish])

  const elapsed = Math.max(0.001, (performance.now() - startRef.current) / 1000)
  const cpm = (correctJamoRef.current / elapsed) * 60
  const ks = engine.keystrokes()
  const accuracy = ks > 0 ? Math.min(100, (correctJamoRef.current / ks) * 100) : 100
  const next = sentences[(idx + 1) % Math.max(1, sentences.length)] ?? ''

  return (
    <div className="h-full flex flex-col">
      <Hud timeLeft={timeLeft} cpm={cpm} accuracy={accuracy} hangulMode={engine.hangulMode} />

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8 min-h-0">
        <p className="text-slate-500 text-xl">완료한 문장 {doneCountRef.current}개 · Enter로 건너뛰기</p>
        <div className="w-full max-w-5xl border-2 border-fuchsia-500/50 rounded-2xl px-10 py-8 bg-slate-950/80">
          <DiffText
            target={target}
            committed={engine.committed}
            composing={engine.composing}
            sizeClass="text-3xl md:text-4xl"
          />
        </div>
        <p className="text-slate-600 text-xl max-w-4xl truncate">다음: {next}</p>
      </div>
    </div>
  )
}
