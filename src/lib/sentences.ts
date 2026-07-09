import { supabase } from './supabase'
import { DEFAULT_SENTENCES, type Level } from './defaultSentences'

// 게임 출제 문장. 앱 시작 시 서버에서 fetch해 캐시하고,
// 실패하면 번들에 내장된 기본 문장으로 동작한다 (오프라인 내성).

const CACHE_KEY = 'typing_sentences_cache_v1'

export { DEFAULT_SENTENCES, type Level }

function loadCache(): Record<Level, string[]> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** 레벨별 활성 문장 (캐시 → 기본 문장 순 폴백) */
export function getSentences(level: Level): string[] {
  const cached = loadCache()
  const list = cached?.[level]
  return list && list.length > 0 ? list : DEFAULT_SENTENCES[level]
}

/** 서버에서 문장 새로고침 (앱 시작·게임 시작 시 호출, 실패해도 무시) */
export async function refreshSentences(): Promise<void> {
  if (!supabase || !navigator.onLine) return
  try {
    const { data, error } = await supabase
      .from('sentences')
      .select('level, text')
      .eq('is_active', true)
    if (error || !data) return
    const byLevel: Record<Level, string[]> = { 1: [], 2: [], 3: [] }
    for (const row of data) {
      const lv = row.level as Level
      if (byLevel[lv]) byLevel[lv].push(row.text as string)
    }
    // 서버에 문장이 하나라도 있으면 캐시 갱신
    if (data.length > 0) localStorage.setItem(CACHE_KEY, JSON.stringify(byLevel))
  } catch {
    // 오프라인 등 — 기존 캐시/기본 문장 유지
  }
}
