// 랭킹전(장문 챌린지) 응모 횟수 제한: 등록 참가자 1인(전화번호 기준)당 3회.
// 행사장 오프라인 환경을 고려해 기기 localStorage에 기록한다 (키오스크 1대 운영 기준).
// 익명 체험은 응모가 아니므로 제한하지 않는다.

const KEY = 'typing_long_entries_v1'

export const LONG_ENTRY_LIMIT = 3

function load(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** 해당 참가자가 지금까지 사용한 랭킹전 응모 횟수 */
export function longEntriesUsed(phone: string): number {
  return load()[phone] ?? 0
}

/** 남은 응모 횟수 (0 이하면 응모 불가) */
export function longEntriesLeft(phone: string): number {
  return Math.max(0, LONG_ENTRY_LIMIT - longEntriesUsed(phone))
}

/** 랭킹전 플레이 완료 시 1회 차감 */
export function addLongEntry(phone: string): void {
  try {
    const map = load()
    map[phone] = (map[phone] ?? 0) + 1
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // localStorage 실패는 무시 (게임 진행이 우선)
  }
}
