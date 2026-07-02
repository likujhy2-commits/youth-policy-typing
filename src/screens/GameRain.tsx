import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Hud from '../components/Hud'
import { useSession } from '../context/SessionContext'
import { useTypingEngine } from '../hooks/useTypingEngine'
import { sfx } from '../lib/audio'
import { textJamoCount } from '../lib/hangul/jamo'
import { getSentences } from '../lib/sentences'
import { shuffle } from '../lib/util'

interface FallingWord {
  id: number
  text: string
  x: number // %
  y: number // %
  speed: number // %/s
}

const DURATION = 60
const LIVES = 5
const MISS_LINE = 88 // % — 이 아래로 내려가면 미스

export default function GameRain() {
  const navigate = useNavigate()
  const { setResult } = useSession()

  const wordsRef = useRef<FallingWord[]>([])
  const livesRef = useRef(LIVES)
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const clearedJamoRef = useRef(0)
  const endedRef = useRef(false)
  const startRef = useRef(performance.now())
  const nextSpawnAtRef = useRef(800)
  const idSeq = useRef(0)
  const poolRef = useRef<string[]>([])
  const [, setFrame] = useState(0)

  const tryMatch = useCallback((text: string, manual: boolean): boolean => {
    const t = text.trim()
    if (!t) return false
    const idx = wordsRef.current.findIndex((w) => w.text === t)
    if (idx >= 0) {
      wordsRef.current.splice(idx, 1)
      comboRef.current++
      scoreRef.current += 100 + (comboRef.current - 1) * 10
      clearedJamoRef.current += textJamoCount(t)
      sfx.clear()
      return true
    }
    if (manual) {
      comboRef.current = 0
      sfx.miss()
    }
    return false
  }, [])

  const engine = useTypingEngine({
    enabled: true,
    submitOnSpace: true,
    onSubmit: (text) => tryMatch(text, true),
    onKeystroke: () => sfx.key(),
  })

  const keystrokesFn = useRef(engine.keystrokes)
  keystrokesFn.current = engine.keystrokes

  const finish = useCallback(() => {
    if (endedRef.current) return
    endedRef.current = true
    sfx.end()
    const elapsed = Math.max(1, Math.min(DURATION, (performance.now() - startRef.current) / 1000))
    const cpm = Math.round((clearedJamoRef.current / elapsed) * 60)
    const ks = keystrokesFn.current()
    const accuracy = ks > 0 ? Math.min(100, Math.round((clearedJamoRef.current / ks) * 1000) / 10) : 100
    setResult({ mode: 'rain', score: scoreRef.current, cpm, accuracy })
    navigate('/result')
  }, [navigate, setResult])

  // 조합 중 글자 포함 실시간 판정: 입력이 단어와 일치하면 즉시 제거
  const { text } = engine
  const takeAndClearRef = useRef(engine.takeAndClear)
  takeAndClearRef.current = engine.takeAndClear
  useEffect(() => {
    if (text && tryMatch(text, false)) takeAndClearRef.current()
  }, [text, tryMatch])

  // 게임 루프
  useEffect(() => {
    poolRef.current = shuffle(getSentences(1))
    startRef.current = performance.now()
    let raf = 0
    let last = performance.now()

    const spawn = (elapsed: number) => {
      const onScreen = new Set(wordsRef.current.map((w) => w.text))
      let pool = poolRef.current.filter((w) => !onScreen.has(w))
      if (pool.length === 0) pool = poolRef.current
      if (pool.length === 0) return
      const word = pool[Math.floor(Math.random() * pool.length)]
      wordsRef.current.push({
        id: idSeq.current++,
        text: word,
        x: 5 + Math.random() * 75,
        y: -4,
        speed: 7 + elapsed * 0.14 + Math.random() * 2, // 시간이 지날수록 가속
      })
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const elapsedMs = now - startRef.current
      const elapsed = elapsedMs / 1000

      if (elapsed >= DURATION) {
        finish()
        return
      }

      if (elapsedMs >= nextSpawnAtRef.current) {
        spawn(elapsed)
        nextSpawnAtRef.current += Math.max(1000, 2200 - elapsed * 18)
      }

      let missed = 0
      wordsRef.current = wordsRef.current.filter((w) => {
        w.y += w.speed * dt
        if (w.y > MISS_LINE) {
          missed++
          return false
        }
        return true
      })
      if (missed > 0) {
        livesRef.current -= missed
        comboRef.current = 0
        sfx.miss()
      }
      if (livesRef.current <= 0) {
        finish()
        return
      }

      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [finish])

  const elapsed = Math.max(0.001, (performance.now() - startRef.current) / 1000)
  const cpm = (clearedJamoRef.current / elapsed) * 60
  const ks = engine.keystrokes()
  const accuracy = ks > 0 ? Math.min(100, (clearedJamoRef.current / ks) * 100) : 100

  return (
    <div className="h-full flex flex-col">
      <Hud
        timeLeft={DURATION - elapsed}
        cpm={cpm}
        accuracy={accuracy}
        combo={comboRef.current}
        lives={livesRef.current}
        hangulMode={engine.hangulMode}
      />

      <div className="relative flex-1 overflow-hidden">
        {wordsRef.current.map((w) => (
          <span
            key={w.id}
            className="absolute text-3xl md:text-4xl text-cyan-200 neon-text whitespace-nowrap"
            style={{ left: `${w.x}%`, top: `${w.y}%` }}
          >
            {w.text}
          </span>
        ))}
        {/* 미스 라인 */}
        <div className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500/60" style={{ top: `${MISS_LINE + 5}%` }} />
      </div>

      <div className="px-8 py-5 bg-slate-950/90 border-t-2 border-cyan-500/40 flex items-center gap-4">
        <span className="text-slate-500 text-2xl">▶</span>
        <span className="text-4xl min-h-[3rem] tracking-wider">
          <span className="text-cyan-300">{engine.committed}</span>
          <span className="text-yellow-300">{engine.composing}</span>
          <span className="animate-blink text-cyan-400">_</span>
        </span>
        <span className="ml-auto text-slate-500 text-xl">점수 <b className="text-lime-300 text-3xl tabular-nums">{scoreRef.current}</b></span>
      </div>
    </div>
  )
}
