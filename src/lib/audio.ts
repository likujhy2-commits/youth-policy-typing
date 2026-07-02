// WebAudio 기반 효과음 (오디오 파일 불필요 → 오프라인 안전)

const MUTE_KEY = 'typing_muted'
let ctx: AudioContext | null = null
let muted = localStorage.getItem(MUTE_KEY) === '1'

function ensureCtx(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function beep(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.04) {
  if (muted) return
  const c = ensureCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration)
  osc.connect(gain).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + duration)
}

export const sfx = {
  /** 정타 타건음 */
  key: () => beep(750 + Math.random() * 150, 0.04, 'square', 0.025),
  /** 단어/문장 클리어 */
  clear: () => {
    beep(880, 0.08)
    setTimeout(() => beep(1320, 0.12), 70)
  },
  /** 오타/미스 */
  miss: () => beep(160, 0.18, 'sawtooth', 0.05),
  /** 게임 종료 */
  end: () => {
    beep(660, 0.1)
    setTimeout(() => beep(880, 0.1), 110)
    setTimeout(() => beep(1100, 0.25), 220)
  },
}

export function isMuted() {
  return muted
}

export function toggleMute(): boolean {
  muted = !muted
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  return muted
}
