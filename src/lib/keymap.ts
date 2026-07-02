// 물리 키코드(KeyboardEvent.code) → 두벌식 자모 매핑.
// e.key 대신 e.code를 쓰므로 OS의 한/영 IME 상태와 무관하게 동작한다.

export const BASE_MAP: Record<string, string> = {
  KeyQ: 'ㅂ', KeyW: 'ㅈ', KeyE: 'ㄷ', KeyR: 'ㄱ', KeyT: 'ㅅ',
  KeyY: 'ㅛ', KeyU: 'ㅕ', KeyI: 'ㅑ', KeyO: 'ㅐ', KeyP: 'ㅔ',
  KeyA: 'ㅁ', KeyS: 'ㄴ', KeyD: 'ㅇ', KeyF: 'ㄹ', KeyG: 'ㅎ',
  KeyH: 'ㅗ', KeyJ: 'ㅓ', KeyK: 'ㅏ', KeyL: 'ㅣ',
  KeyZ: 'ㅋ', KeyX: 'ㅌ', KeyC: 'ㅊ', KeyV: 'ㅍ',
  KeyB: 'ㅠ', KeyN: 'ㅜ', KeyM: 'ㅡ',
}

export const SHIFT_MAP: Record<string, string> = {
  KeyQ: 'ㅃ', KeyW: 'ㅉ', KeyE: 'ㄸ', KeyR: 'ㄲ', KeyT: 'ㅆ',
  KeyO: 'ㅒ', KeyP: 'ㅖ',
}

/** 한/영 전환 키 판정: 한/영키, 우측 Alt, Shift+Space */
export function isLangToggleKey(e: KeyboardEvent): boolean {
  return (
    e.key === 'HangulMode' ||
    e.code === 'Lang1' ||
    e.code === 'AltRight' ||
    (e.shiftKey && e.code === 'Space')
  )
}
