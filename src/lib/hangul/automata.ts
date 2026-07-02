import { JONG, JONG_COMBO, JONG_SPLIT, JUNG_COMBO, JUNG_SPLIT, composeSyllable, isVowel } from './tables'

/**
 * 두벌식 한글 오토마타.
 * IME에 의존하지 않고 자모(호환 자모 문자) 입력을 받아 음절을 조합한다.
 * input()의 반환값은 이번 입력으로 "확정된" 문자열이며,
 * 조합 중인 글자는 composing 게터로 조회한다.
 */
export class HangulAutomata {
  private cho = ''
  private jung = ''
  private jong = ''

  /** 현재 조합 중인 글자 (없으면 빈 문자열) */
  get composing(): string {
    if (this.cho && this.jung) return composeSyllable(this.cho, this.jung, this.jong)
    if (this.cho) return this.cho
    if (this.jung) return this.jung
    return ''
  }

  get isComposing(): boolean {
    return !!(this.cho || this.jung)
  }

  /** 조합 중인 글자를 확정하고 상태를 비운다 */
  commit(): string {
    const out = this.composing
    this.cho = this.jung = this.jong = ''
    return out
  }

  /** 자모 하나 입력. 이번 입력으로 확정된 문자열을 반환 */
  input(jamo: string): string {
    return isVowel(jamo) ? this.inputVowel(jamo) : this.inputConsonant(jamo)
  }

  private inputConsonant(c: string): string {
    if (!this.cho && !this.jung) {
      this.cho = c
      return ''
    }
    if (this.cho && !this.jung) {
      // 초성만 있는 상태에서 자음: 기존 초성 확정 후 새 초성
      const out = this.cho
      this.cho = c
      return out
    }
    if (!this.cho && this.jung) {
      // 홀로 있는 모음 뒤 자음: 모음 확정 후 새 초성
      const out = this.commit()
      this.cho = c
      return out
    }
    // 초성+중성 존재
    if (!this.jong) {
      if (JONG.includes(c)) {
        this.jong = c
        return ''
      }
      // ㄸ·ㅃ·ㅉ 등 받침 불가 자음
      const out = this.commit()
      this.cho = c
      return out
    }
    const combined = JONG_COMBO[this.jong]?.[c]
    if (combined) {
      this.jong = combined
      return ''
    }
    const out = this.commit()
    this.cho = c
    return out
  }

  private inputVowel(v: string): string {
    if (this.jong) {
      // 도깨비불: 받침(겹받침이면 뒤 자모)이 다음 글자 초성으로 이동
      const split = JONG_SPLIT[this.jong]
      const moved = split ? split[1] : this.jong
      this.jong = split ? split[0] : ''
      const out = this.commit()
      this.cho = moved
      this.jung = v
      return out
    }
    if (this.cho && !this.jung) {
      this.jung = v
      return ''
    }
    if (this.jung) {
      const combined = JUNG_COMBO[this.jung]?.[v]
      if (combined) {
        this.jung = combined
        return ''
      }
      const out = this.commit()
      this.jung = v
      return out
    }
    this.jung = v
    return ''
  }

  /**
   * 조합 중 자모 단위 삭제.
   * 조합 상태에서 처리했으면 true, 조합 중이 아니면 false(확정 글자 삭제는 호출측 책임)
   */
  backspace(): boolean {
    if (this.jong) {
      const split = JONG_SPLIT[this.jong]
      this.jong = split ? split[0] : ''
      return true
    }
    if (this.jung) {
      const split = JUNG_SPLIT[this.jung]
      if (split) {
        this.jung = split[0]
      } else {
        this.jung = ''
      }
      return true
    }
    if (this.cho) {
      this.cho = ''
      return true
    }
    return false
  }
}
