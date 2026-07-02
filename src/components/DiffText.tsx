interface DiffTextProps {
  target: string
  committed: string
  composing: string
  className?: string
}

/**
 * 목표 문장 대비 입력 상태 표시.
 * 확정 글자는 정/오 색상, 조합 중 글자는 노란색(판정 보류), 커서 밑줄 표시.
 */
export default function DiffText({ target, committed, composing, className = '' }: DiffTextProps) {
  const targetChars = [...target]
  const committedChars = [...committed]
  const cursorIndex = committedChars.length

  return (
    <p className={`leading-relaxed break-keep ${className}`}>
      {targetChars.map((ch, i) => {
        let cls = 'text-slate-500'
        let shown = ch
        if (i < committedChars.length) {
          cls = committedChars[i] === ch ? 'text-cyan-300' : 'text-rose-400 bg-rose-950/60'
        } else if (i === committedChars.length && composing) {
          cls = 'text-yellow-300'
          shown = composing
        }
        const isCursor = i === cursorIndex && i >= committedChars.length
        return (
          <span key={i} className={`${cls} ${isCursor ? 'border-b-4 border-yellow-300' : ''}`}>
            {shown === ' ' ? ' ' : shown}
          </span>
        )
      })}
    </p>
  )
}
