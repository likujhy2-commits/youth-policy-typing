import { supabase } from './supabase'
import { maskName, todayStartISO } from './util'
import type { PlayData } from './offlineQueue'

export type GameMode = 'rain' | 'sentence' | 'long'

export const MODE_LABEL: Record<GameMode, string> = {
  rain: '산성비',
  sentence: '문장 타자',
  long: '장문 챌린지',
}

export interface GameResult {
  mode: GameMode
  score: number
  cpm: number
  accuracy: number
}

/** CPM 기준 5단계 등급 칭호 */
export function gradeFor(cpm: number): { title: string; emoji: string } {
  if (cpm >= 400) return { title: '정책 타이핑 마스터', emoji: '👑' }
  if (cpm >= 300) return { title: '드림 키보드 워리어', emoji: '⚡' }
  if (cpm >= 200) return { title: '커리어 스프린터', emoji: '🚀' }
  if (cpm >= 100) return { title: '정책 견습 타이피스트', emoji: '🔥' }
  return { title: '타자 새싹', emoji: '🌱' }
}

// ── 오늘의 랭킹: 서버(마스킹 뷰) + 로컬 미전송분 병합 ──

const LOCAL_PLAYS_KEY = 'typing_local_plays_v1'

export interface RankEntry {
  name: string // 마스킹된 이름
  mode: GameMode
  score: number
  cpm: number
  local?: boolean
}

interface LocalPlay extends PlayData {
  maskedName: string
  day: string
}

/** 로컬 랭킹용 기록 (서버 저장 여부와 무관하게 항상 기록, 당일분만 유지) */
export function addLocalPlay(play: PlayData, name: string | null) {
  try {
    const day = new Date().toDateString()
    const list: LocalPlay[] = JSON.parse(localStorage.getItem(LOCAL_PLAYS_KEY) ?? '[]')
    const todays = list.filter((p) => p.day === day)
    todays.push({ ...play, maskedName: name ? maskName(name) : '익명', day })
    localStorage.setItem(LOCAL_PLAYS_KEY, JSON.stringify(todays.slice(-300)))
  } catch {
    // localStorage 실패는 무시
  }
}

export async function getTodayRanking(mode: GameMode, limit = 10): Promise<RankEntry[]> {
  const entries: RankEntry[] = []

  if (supabase && navigator.onLine) {
    try {
      const { data } = await supabase
        .from('ranking_today')
        .select('masked_name, mode, score, cpm')
        .eq('mode', mode)
        .order('score', { ascending: false })
        .limit(limit)
      for (const r of data ?? []) {
        entries.push({ name: r.masked_name, mode: r.mode, score: r.score, cpm: r.cpm })
      }
    } catch {
      // 서버 랭킹 실패 → 로컬만 표시
    }
  }

  try {
    const day = new Date().toDateString()
    const list: LocalPlay[] = JSON.parse(localStorage.getItem(LOCAL_PLAYS_KEY) ?? '[]')
    for (const p of list) {
      if (p.day !== day || p.mode !== mode) continue
      entries.push({ name: p.maskedName, mode: p.mode, score: p.score, cpm: p.cpm, local: true })
    }
  } catch {
    // 무시
  }

  // 서버+로컬 중복 가능성이 있으나 (이름, 점수, cpm) 동일 건은 하나만
  const seen = new Set<string>()
  const merged = entries.filter((e) => {
    const k = `${e.name}|${e.score}|${e.cpm}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  merged.sort((a, b) => b.score - a.score)
  return merged.slice(0, limit)
}

export { todayStartISO }
