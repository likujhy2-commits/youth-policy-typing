import { useState } from 'react'
import { isMuted, toggleMute } from '../lib/audio'

interface HudProps {
  timeLeft: number
  cpm: number
  accuracy: number
  combo?: number
  lives?: number
  hangulMode: boolean
}

/** 게임 상단 HUD: 남은 시간·타수·정확도·콤보·생명·입력모드·음소거 */
export default function Hud({ timeLeft, cpm, accuracy, combo, lives, hangulMode }: HudProps) {
  const [muted, setMuted] = useState(isMuted())

  return (
    <div className="flex items-center justify-between px-8 py-4 text-xl md:text-2xl border-b-2 border-cyan-500/40 bg-slate-950/70">
      <div className="flex items-center gap-8">
        <span className={`tabular-nums ${timeLeft <= 10 ? 'text-rose-400 neon-text' : 'text-cyan-300'}`}>
          ⏱ {Math.max(0, Math.ceil(timeLeft))}초
        </span>
        <span className="text-lime-300 tabular-nums">{Math.round(cpm)} 타/분</span>
        <span className="text-fuchsia-300 tabular-nums">정확도 {accuracy.toFixed(0)}%</span>
        {combo !== undefined && combo >= 2 && (
          <span key={combo} className="text-yellow-300 neon-text animate-combo">{combo} COMBO!</span>
        )}
      </div>
      <div className="flex items-center gap-6">
        {lives !== undefined && (
          <span className="text-rose-400 tracking-widest">{'❤'.repeat(Math.max(0, lives))}</span>
        )}
        <span className={`px-3 py-1 border-2 rounded ${hangulMode ? 'border-cyan-400 text-cyan-300' : 'border-amber-400 text-amber-300'}`}>
          {hangulMode ? '한' : 'A'}
        </span>
        <button
          className="text-slate-300 text-2xl"
          onClick={() => setMuted(toggleMute())}
          aria-label="음소거 토글"
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  )
}
