/** 이름 마스킹: 김하영→김*영, 김영→김*, 김→* */
export function maskName(name: string): string {
  const chars = [...name.trim()]
  if (chars.length <= 1) return '*'
  if (chars.length === 2) return chars[0] + '*'
  return chars[0] + '*'.repeat(chars.length - 2) + chars[chars.length - 1]
}

/** 연락처 마스킹: 01012345678 → 010-****-5678 */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length < 10) return '***'
  return `${d.slice(0, 3)}-****-${d.slice(-4)}`
}

/** 하이픈 제거 숫자만 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/** 010-XXXX-XXXX 형식 검증 */
export function isValidPhone(phone: string): boolean {
  return /^010\d{8}$/.test(normalizePhone(phone))
}

/** 입력 중 자동 하이픈 */
export function formatPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

export function uuid(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function todayStartISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
