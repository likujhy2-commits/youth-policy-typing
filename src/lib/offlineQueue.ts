import { supabase } from './supabase'
import { uuid } from './util'

// 행사장 무선 환경 대비: 전송 실패분을 localStorage 큐에 쌓고 온라인 복귀 시 재전송.
// 참가자 등록이 큐에 있는 동안의 플레이 기록은 tempId로 참조하고,
// 참가자 flush 성공 시 tempId → 서버 uuid 매핑 후 플레이를 전송한다.

const QUEUE_KEY = 'typing_offline_queue_v1'
const IDMAP_KEY = 'typing_participant_idmap_v1'

export interface ParticipantData {
  name: string
  phone: string
  consent_at: string
}

export interface PlayData {
  mode: 'rain' | 'sentence' | 'long'
  score: number
  cpm: number
  accuracy: number
  created_at: string
}

type QueueItem =
  | { kind: 'participant'; tempId: string; data: ParticipantData }
  | { kind: 'play'; data: PlayData; participantRef: string | null }

function loadQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveQueue(q: QueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
}

function loadIdMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(IDMAP_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveIdMap(m: Record<string, string>) {
  localStorage.setItem(IDMAP_KEY, JSON.stringify(m))
}

export function pendingCount(): number {
  return loadQueue().length
}

/** 아직 서버로 전송되지 못한 플레이의 식별 키 (mode|score|cpm|created_at) */
export function pendingPlayKeys(): Set<string> {
  const keys = new Set<string>()
  for (const item of loadQueue()) {
    if (item.kind === 'play') {
      keys.add(`${item.data.mode}|${item.data.score}|${item.data.cpm}|${item.data.created_at}`)
    }
  }
  return keys
}

const isTempId = (ref: string) => ref.startsWith('temp_')

/**
 * 참가자 저장. 서버 저장 성공 시 서버 uuid, 실패(오프라인 등) 시 tempId 반환.
 * 반환된 ref는 이후 savePlay의 participantRef로 사용.
 */
export async function saveParticipant(data: ParticipantData): Promise<string> {
  if (supabase && navigator.onLine) {
    try {
      // id는 클라이언트에서 생성한다. insert 후 .select('id')로 돌려받는 방식은
      // anon 키에 참가자 SELECT 권한이 없어(개인정보 보호 RLS) 등록 자체가 거부된다.
      const id = uuid()
      const { error } = await supabase
        .from('participants')
        .insert({ id, name: data.name, phone: data.phone, consent_at: data.consent_at })
      if (!error) return id
    } catch {
      // 큐로 폴백
    }
  }
  const tempId = `temp_${uuid()}`
  const q = loadQueue()
  q.push({ kind: 'participant', tempId, data })
  saveQueue(q)
  return tempId
}

/** 플레이 기록 저장. 실패 시 큐에 보관 */
export async function savePlay(data: PlayData, participantRef: string | null): Promise<void> {
  let ref = participantRef
  if (ref && isTempId(ref)) {
    const mapped = loadIdMap()[ref]
    if (mapped) ref = mapped
  }
  if (supabase && navigator.onLine && (!ref || !isTempId(ref))) {
    try {
      const { error } = await supabase.from('plays').insert({
        participant_id: ref,
        mode: data.mode,
        score: data.score,
        cpm: data.cpm,
        accuracy: data.accuracy,
        created_at: data.created_at,
      })
      if (!error) return
    } catch {
      // 큐로 폴백
    }
  }
  const q = loadQueue()
  q.push({ kind: 'play', data, participantRef: ref })
  saveQueue(q)
}

let flushing = false

/** 큐 재전송. 참가자 먼저 처리해 id 매핑을 만든 뒤 플레이 전송 */
export async function flushQueue(): Promise<number> {
  if (!supabase || !navigator.onLine || flushing) return pendingCount()
  flushing = true
  try {
    const idMap = loadIdMap()
    let queue = loadQueue()
    const remain: QueueItem[] = []

    for (const item of queue) {
      if (item.kind !== 'participant') continue
      try {
        // saveParticipant와 동일: 클라이언트 생성 id로 insert (RETURNING 불가 — RLS)
        const id = uuid()
        const { error } = await supabase.from('participants').insert({ id, ...item.data })
        if (error) throw error
        idMap[item.tempId] = id
      } catch {
        remain.push(item)
      }
    }
    saveIdMap(idMap)

    for (const item of queue) {
      if (item.kind !== 'play') continue
      let ref = item.participantRef
      if (ref && isTempId(ref)) {
        const mapped = idMap[ref]
        if (!mapped) {
          // 참가자가 아직 미전송 → 함께 보류
          remain.push(item)
          continue
        }
        ref = mapped
      }
      try {
        const { error } = await supabase.from('plays').insert({
          participant_id: ref,
          mode: item.data.mode,
          score: item.data.score,
          cpm: item.data.cpm,
          accuracy: item.data.accuracy,
          created_at: item.data.created_at,
        })
        if (error) throw error
      } catch {
        remain.push({ ...item, participantRef: ref })
      }
    }

    saveQueue(remain)
    return remain.length
  } finally {
    flushing = false
  }
}

/** 앱 시작 시 1회 호출: online 이벤트 + 30초 주기로 자동 flush */
export function startQueueAutoFlush() {
  window.addEventListener('online', () => void flushQueue())
  setInterval(() => void flushQueue(), 30_000)
  void flushQueue()
}
