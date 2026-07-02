-- 청년정책 타자게임 초기 스키마 + RLS + 시드
-- Supabase SQL Editor에 붙여넣거나 `supabase db push`로 적용

create extension if not exists "pgcrypto";

-- ── 테이블 ──────────────────────────────────────────────

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null, -- 하이픈 제거 저장 (01012345678)
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.plays (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete set null, -- 익명 플레이는 null
  mode text not null check (mode in ('rain', 'sentence', 'long')),
  score int not null default 0,
  cpm int not null default 0,
  accuracy numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sentences (
  id uuid primary key default gen_random_uuid(),
  level int not null check (level in (1, 2, 3)),
  text text not null,
  is_active boolean not null default true
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete cascade,
  prize text not null,
  drawn_at timestamptz not null default now()
);

create index if not exists plays_created_at_idx on public.plays (created_at desc);
create index if not exists plays_mode_score_idx on public.plays (mode, score desc);

-- ── RLS: 익명 키는 쓰기만, 원본 조회는 관리자만 ─────────────

alter table public.participants enable row level security;
alter table public.plays enable row level security;
alter table public.sentences enable row level security;
alter table public.draws enable row level security;

-- 키오스크(anon): 참가자·플레이 INSERT만 허용
create policy "anon insert participants" on public.participants
  for insert to anon with check (true);
create policy "anon insert plays" on public.plays
  for insert to anon with check (true);
-- 키오스크(anon): 활성 문장 조회 허용
create policy "anon read active sentences" on public.sentences
  for select to anon using (is_active = true);

-- 관리자(authenticated): 전체 권한
create policy "admin all participants" on public.participants
  for all to authenticated using (true) with check (true);
create policy "admin all plays" on public.plays
  for all to authenticated using (true) with check (true);
create policy "admin all sentences" on public.sentences
  for all to authenticated using (true) with check (true);
create policy "admin all draws" on public.draws
  for all to authenticated using (true) with check (true);

-- ── 랭킹 뷰: 마스킹된 이름 + 점수만 익명 노출 ────────────────
-- (뷰 소유자 권한으로 실행되어 RLS를 우회하되, 마스킹된 컬럼만 노출)

create or replace view public.ranking_today as
select
  p.mode,
  p.score,
  p.cpm,
  p.accuracy,
  case
    when pa.name is null then '익명'
    when char_length(pa.name) <= 1 then '*'
    when char_length(pa.name) = 2 then left(pa.name, 1) || '*'
    else left(pa.name, 1) || repeat('*', char_length(pa.name) - 2) || right(pa.name, 1)
  end as masked_name,
  p.created_at
from public.plays p
left join public.participants pa on pa.id = p.participant_id
where p.created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';

grant select on public.ranking_today to anon, authenticated;

-- ── 시드 문장 ────────────────────────────────────────────

insert into public.sentences (level, text) values
  (1, '일경험드림'), (1, '드림터'), (1, '청년수당'), (1, '자기주도형'), (1, '커리어'),
  (1, '광주청년'), (1, '직무경험'), (1, '매칭데이'), (1, '인턴십'), (1, '잡스타트'),
  (2, '광주 청년이라면 일경험드림사업으로 커리어를 시작하세요'),
  (2, '드림터에서 5개월간 실전 직무 경험을 쌓을 수 있어요'),
  (2, '일경험드림사업은 청년과 기업을 일대일로 연결합니다'),
  (2, '참여 청년에게는 매월 활동지원금이 지급됩니다'),
  (2, '지금 바로 큐알코드로 20기 모집에 신청하세요'),
  (3, '광주 청년일경험드림사업은 광주에 사는 청년에게 지역 기업에서 5개월간 실전 직무 경험을 제공하는 프로그램입니다. 참여 청년에게는 매월 활동지원금이 지급되며, 전담 멘토가 커리어 설계를 함께 돕습니다. 지금 바로 큐알코드를 찍고 20기 모집에 신청해 보세요.'),
  (3, '일경험드림사업은 청년과 기업을 일대일로 연결하는 광주형 청년 일자리 정책입니다. 드림터에서 다양한 직무를 체험하며 자기주도형 커리어를 만들어 갈 수 있습니다. 참여 기간 동안 직무 교육과 네트워킹 프로그램도 함께 제공됩니다. 여러분의 첫 커리어, 일경험드림이 함께합니다.');
