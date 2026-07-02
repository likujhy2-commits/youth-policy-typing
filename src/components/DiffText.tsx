interface DiffTextProps {
  target: string
  committed: string
  composing: string
  /** 글자 크기 클래스 (제시문·입력 공통) */
  sizeClass?: string
}

/**
 * 2단 타이핑 패널.
 * 위: 제시문 (지금 쳐야 할 글자에 밑줄 표시)
 * 아래: 참여자가 입력한 글 (정타 파랑 / 오타 빨강 / 조합 중 노랑)
 * → 참여자가 자기 글에서 어디가 틀렸는지 바로 확인 가능
 */
export default function DiffText({ target, committed, composing, sizeClass = 'text-3xl' }: DiffTextProps) {
  const targetChars = [...target]
  const typedChars = [...committed]
  const pos = typedChars.length

  return (
    <div className="w-full">
      {/* 제시문 */}
      <p className={`leading-relaxed break-keep whitespace-pre-wrap ${sizeClass}`}>
        {targetChars.map((ch, i) => {
          let cls = 'text-slate-300'
          if (i < pos) cls = typedChars[i] === ch ? 'text-slate-600' : 'text-slate-600 underline decoration-rose-500'
          else if (i === pos) cls = 'text-white border-b-4 border-cyan-400'
          return (
            <span key={i} className={cls}>
              {ch}
            </span>
          )
        })}
      </p>

      <div className="my-4 border-t-2 border-dashed border-slate-700" />

      {/* 참여자 입력 */}
      <p className={`leading-relaxed break-keep whitespace-pre-wrap min-h-[1.5em] ${sizeClass}`}>
        <span className="text-slate-600 mr-2">▶</span>
        {typedChars.map((ch, i) => {
          const ok = i < targetChars.length && targetChars[i] === ch
          return (
            <span key={i} className={ok ? 'text-cyan-300' : 'text-rose-400 bg-rose-950/70 rounded-sm'}>
              {ch}
            </span>
          )
        })}
        {composing && <span className="text-yellow-300">{composing}</span>}
        <span className="animate-blink text-cyan-400">_</span>
      </p>
    </div>
  )
}
