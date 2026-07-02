import { describe, expect, it } from 'vitest'
import { HangulAutomata } from './automata'
import { jamoCount, textJamoCount } from './jamo'

/** 자모 시퀀스를 입력하고 (확정 + 조합 중) 전체 텍스트를 반환 */
function type(jamos: string): string {
  const a = new HangulAutomata()
  let out = ''
  for (const j of jamos) out += a.input(j)
  return out + a.composing
}

describe('HangulAutomata 기본 조합', () => {
  it('단순 음절 조합', () => {
    expect(type('ㅇㅏㄴㄴㅕㅇ')).toBe('안녕')
    expect(type('ㅇㅏㄴㄴㅕㅇㅎㅏㅅㅔㅇㅛ')).toBe('안녕하세요')
  })

  it('복모음 조합 (ㅗ+ㅏ=ㅘ)', () => {
    expect(type('ㄱㅗㅏㄴ')).toBe('관')
    expect(type('ㅇㅜㅣ')).toBe('위')
    expect(type('ㅇㅡㅣㅅㅏ')).toBe('의사')
  })

  it('쌍자음 초성', () => {
    expect(type('ㅃㅏㅇ')).toBe('빵')
    expect(type('ㅉㅏㅁㅃㅗㅇ')).toBe('짬뽕')
  })

  it('받침 불가 자음(ㄸㅃㅉ)은 새 글자 초성으로', () => {
    expect(type('ㅇㅏㄸㅏ')).toBe('아따')
  })
})

describe('겹받침', () => {
  it('겹받침 조합', () => {
    expect(type('ㄱㅏㅂㅅ')).toBe('값')
    expect(type('ㄷㅏㄹㄱ')).toBe('닭')
    expect(type('ㅇㅏㄴㅈ')).toBe('앉')
  })

  it('겹받침 뒤 모음이 오면 뒤 자모만 이동 (값+이=갑시... 아니고 값이 → 갑ㅅ+ㅣ)', () => {
    expect(type('ㄱㅏㅂㅅㅣ')).toBe('갑시')
    expect(type('ㄷㅏㄹㄱㅣ')).toBe('달기')
  })
})

describe('도깨비불 현상', () => {
  it('받침이 다음 글자 초성으로 이동 (각+ㅣ+ㄴ → 가긴)', () => {
    expect(type('ㄱㅏㄱㅣㄴ')).toBe('가긴')
  })

  it('연속 도깨비불', () => {
    // 저ㅁ→점, ㅜ 오면 점→저+무
    expect(type('ㅈㅓㅁㅜㄴ')).toBe('저문')
  })
})

describe('홀로 있는 자모', () => {
  it('자음만 연속 입력', () => {
    expect(type('ㄱㄴㄷ')).toBe('ㄱㄴㄷ')
  })

  it('모음 먼저 입력 후 자음', () => {
    expect(type('ㅏㄱㅏ')).toBe('ㅏ가')
  })
})

describe('백스페이스 (자모 단위 삭제)', () => {
  it('값 → 갑 → 가 → ㄱ → 빈문자열', () => {
    const a = new HangulAutomata()
    for (const j of 'ㄱㅏㅂㅅ') a.input(j)
    expect(a.composing).toBe('값')
    a.backspace()
    expect(a.composing).toBe('갑')
    a.backspace()
    expect(a.composing).toBe('가')
    a.backspace()
    expect(a.composing).toBe('ㄱ')
    expect(a.backspace()).toBe(true)
    expect(a.composing).toBe('')
    expect(a.backspace()).toBe(false) // 조합 중 아님 → 호출측이 확정 글자 삭제
  })

  it('복모음 백스페이스 (관 → 고 → ㄱ)', () => {
    const a = new HangulAutomata()
    for (const j of 'ㄱㅗㅏㄴ') a.input(j)
    expect(a.composing).toBe('관')
    a.backspace()
    expect(a.composing).toBe('과')
    a.backspace()
    expect(a.composing).toBe('고')
    a.backspace()
    expect(a.composing).toBe('ㄱ')
  })
})

describe('타수(CPM) 자모 분해 계산', () => {
  it('값 = 4타', () => expect(jamoCount('값')).toBe(4))
  it('관 = 4타 (복모음 2타)', () => expect(jamoCount('관')).toBe(4))
  it('빵 = 3타 (쌍자음 시프트 1타)', () => expect(jamoCount('빵')).toBe(3))
  it('가 = 2타', () => expect(jamoCount('가')).toBe(2))
  it('영문·숫자·공백 = 1타', () => {
    expect(jamoCount('a')).toBe(1)
    expect(jamoCount('5')).toBe(1)
    expect(jamoCount(' ')).toBe(1)
  })
  it('문장 타수 합산', () => {
    expect(textJamoCount('값이')).toBe(6)
  })
})
