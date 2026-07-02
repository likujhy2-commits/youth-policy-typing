import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { GameResult } from '../lib/score'

export interface SessionParticipant {
  /** 서버 uuid 또는 오프라인 tempId */
  ref: string
  name: string
  phone: string
}

interface SessionState {
  /** null = 익명 플레이 */
  participant: SessionParticipant | null
  result: GameResult | null
  setParticipant: (p: SessionParticipant | null) => void
  setResult: (r: GameResult | null) => void
  /** 어트랙트 복귀 시 진행 중 데이터 초기화 */
  resetSession: () => void
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [participant, setParticipant] = useState<SessionParticipant | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const resetSession = useCallback(() => {
    setParticipant(null)
    setResult(null)
  }, [])

  return (
    <SessionContext.Provider value={{ participant, result, setParticipant, setResult, resetSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
