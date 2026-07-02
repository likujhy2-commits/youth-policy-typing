import { supabase } from './supabase'

// 게임 출제 문장. 앱 시작 시 서버에서 fetch해 캐시하고,
// 실패하면 번들에 내장된 기본 문장으로 동작한다 (오프라인 내성).

const CACHE_KEY = 'typing_sentences_cache_v1'

export type Level = 1 | 2 | 3

export const DEFAULT_SENTENCES: Record<Level, string[]> = {
  1: ['일경험드림', '드림터', '청년수당', '자기주도형', '커리어', '광주청년', '직무경험', '매칭데이', '인턴십', '잡스타트'],
  2: [
    '광주 청년이라면 일경험드림사업으로 커리어를 시작하세요',
    '드림터에서 5개월간 실전 직무 경험을 쌓을 수 있어요',
    '일경험드림사업은 청년과 기업을 일대일로 연결합니다',
    '참여 청년에게는 매월 활동지원금이 지급됩니다',
    '지금 바로 큐알코드로 20기 모집에 신청하세요',
  ],
  3: [
    '광주 청년일경험드림사업은 광주에 사는 청년에게 지역 기업에서 5개월간 실전 직무 경험을 제공하는 프로그램입니다. 참여 청년에게는 매월 활동지원금이 지급되며, 전담 멘토가 커리어 설계를 함께 돕습니다. 지금 바로 큐알코드를 찍고 20기 모집에 신청해 보세요.',
    '일경험드림사업은 청년과 기업을 일대일로 연결하는 광주형 청년 일자리 정책입니다. 드림터에서 다양한 직무를 체험하며 자기주도형 커리어를 만들어 갈 수 있습니다. 참여 기간 동안 직무 교육과 네트워킹 프로그램도 함께 제공됩니다. 여러분의 첫 커리어, 일경험드림이 함께합니다.',
  ],
}

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
