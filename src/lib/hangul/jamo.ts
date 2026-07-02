import { JONG, JUNG, JONG_SPLIT, JUNG_SPLIT } from './tables'

/**
 * 글자 하나의 타수(두벌식 키 입력 횟수).
 * 한컴타자 기준과 동일하게 자모 분해로 계산한다.
 * 예) "값" = ㄱ+ㅏ+ㅂ+ㅅ = 4타, "관" = ㄱ+ㅗ+ㅏ+ㄴ = 4타, "빵" = 3타(ㅃ은 시프트 1타)
 */
export function jamoCount(ch: string): number {
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const idx = code - 0xac00
    const jong = JONG[idx % 28]
    const jung = JUNG[Math.floor(idx / 28) % 21]
    let n = 1 // 초성 (ㄲ 등 쌍자음도 시프트 조합 1타)
    n += JUNG_SPLIT[jung] ? 2 : 1
    if (jong) n += JONG_SPLIT[jong] ? 2 : 1
    return n
  }
  return 1
}

/** 문자열 전체 타수 */
export function textJamoCount(text: string): number {
  let n = 0
  for (const ch of text) n += jamoCount(ch)
  return n
}
