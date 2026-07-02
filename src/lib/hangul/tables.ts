// 두벌식 한글 조합 테이블

export const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

export const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']

export const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

// 모음 결합 (ㅗ+ㅏ=ㅘ 등)
export const JUNG_COMBO: Record<string, Record<string, string>> = {
  'ㅗ': { 'ㅏ': 'ㅘ', 'ㅐ': 'ㅙ', 'ㅣ': 'ㅚ' },
  'ㅜ': { 'ㅓ': 'ㅝ', 'ㅔ': 'ㅞ', 'ㅣ': 'ㅟ' },
  'ㅡ': { 'ㅣ': 'ㅢ' },
}

// 겹받침 결합
export const JONG_COMBO: Record<string, Record<string, string>> = {
  'ㄱ': { 'ㅅ': 'ㄳ' },
  'ㄴ': { 'ㅈ': 'ㄵ', 'ㅎ': 'ㄶ' },
  'ㄹ': { 'ㄱ': 'ㄺ', 'ㅁ': 'ㄻ', 'ㅂ': 'ㄼ', 'ㅅ': 'ㄽ', 'ㅌ': 'ㄾ', 'ㅍ': 'ㄿ', 'ㅎ': 'ㅀ' },
  'ㅂ': { 'ㅅ': 'ㅄ' },
}

// 겹받침 분해 (도깨비불·백스페이스용)
export const JONG_SPLIT: Record<string, [string, string]> = {
  'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'],
}

// 복모음 분해 (백스페이스·타수 계산용)
export const JUNG_SPLIT: Record<string, [string, string]> = {
  'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'], 'ㅢ': ['ㅡ', 'ㅣ'],
}

const VOWEL_SET = new Set(JUNG)
export const isVowel = (jamo: string) => VOWEL_SET.has(jamo)

/** 초/중/종성 자모로 완성형 음절 조합. 조합 불가 시 빈 문자열 */
export function composeSyllable(cho: string, jung: string, jong: string): string {
  const ci = CHO.indexOf(cho)
  const ji = JUNG.indexOf(jung)
  const ti = JONG.indexOf(jong)
  if (ci < 0 || ji < 0 || ti < 0) return ''
  return String.fromCharCode(0xac00 + (ci * 21 + ji) * 28 + ti)
}
