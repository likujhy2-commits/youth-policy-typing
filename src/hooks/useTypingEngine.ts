import { useCallback, useEffect, useRef, useState } from 'react'
import { HangulAutomata } from '../lib/hangul/automata'
import { BASE_MAP, SHIFT_MAP, isLangToggleKey } from '../lib/keymap'

export interface TypingEngineOptions {
  enabled: boolean
  /** 산성비: 스페이스도 제출로 처리 */
  submitOnSpace?: boolean
  /** Enter(또는 submitOnSpace 시 Space) 입력 시 현재 텍스트를 넘기고 입력창 비움 */
  onSubmit?: (text: string) => void
  onKeystroke?: () => void
}

/**
 * IME 비의존 타이핑 엔진.
 * window keydown에서 물리 키코드를 받아 자체 한글 오토마타로 조합한다.
 * OS 한/영 상태와 무관하며, 게임 내 한/영 전환(한/영키·우Alt·Shift+Space)을 자체 처리.
 */
export function useTypingEngine(opts: TypingEngineOptions) {
  const automata = useRef(new HangulAutomata())
  const committedRef = useRef('')
  const keystrokesRef = useRef(0)
  const [committed, setCommitted] = useState('')
  const [composing, setComposing] = useState('')
  const [hangulMode, setHangulMode] = useState(true)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const sync = useCallback(() => {
    setCommitted(committedRef.current)
    setComposing(automata.current.composing)
  }, [])

  const reset = useCallback(() => {
    automata.current = new HangulAutomata()
    committedRef.current = ''
    keystrokesRef.current = 0
    sync()
  }, [sync])

  /** 조합 확정 포함 전체 텍스트를 반환하고 입력창 비움 */
  const takeAndClear = useCallback(() => {
    const text = committedRef.current + automata.current.commit()
    committedRef.current = ''
    sync()
    return text
  }, [sync])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const o = optsRef.current
      if (!o.enabled) return
      if (e.ctrlKey || e.metaKey) return

      if (isLangToggleKey(e)) {
        e.preventDefault()
        setHangulMode((m) => !m)
        return
      }
      if (e.altKey) return

      if (e.code === 'Backspace') {
        e.preventDefault()
        if (!automata.current.backspace()) {
          committedRef.current = committedRef.current.slice(0, -1)
        }
        sync()
        return
      }

      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault()
        o.onSubmit?.(takeAndClear())
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        keystrokesRef.current++
        if (o.submitOnSpace) {
          o.onSubmit?.(takeAndClear())
        } else {
          committedRef.current += automata.current.commit() + ' '
          sync()
        }
        o.onKeystroke?.()
        return
      }

      if (hangulMode && BASE_MAP[e.code]) {
        e.preventDefault()
        const jamo = (e.shiftKey && SHIFT_MAP[e.code]) || BASE_MAP[e.code]
        committedRef.current += automata.current.input(jamo)
        keystrokesRef.current++
        sync()
        o.onKeystroke?.()
        return
      }

      // 영문 모드 또는 숫자·기호
      if (e.key.length === 1) {
        e.preventDefault()
        committedRef.current += automata.current.commit() + e.key
        keystrokesRef.current++
        sync()
        o.onKeystroke?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hangulMode, sync, takeAndClear])

  return {
    /** 확정 텍스트 + 조합 중 글자 */
    text: committed + composing,
    committed,
    composing,
    hangulMode,
    reset,
    takeAndClear,
    keystrokes: () => keystrokesRef.current,
  }
}
