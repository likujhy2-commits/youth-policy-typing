-- 랭킹 뷰 기간 확장: 오늘 → 최근 3일 (오늘 포함, 한국시간 기준)
-- Supabase SQL Editor에 붙여넣고 실행 (여러 번 실행해도 안전)

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
where p.created_at >= (date_trunc('day', now() at time zone 'Asia/Seoul') - interval '2 days') at time zone 'Asia/Seoul';

grant select on public.ranking_today to anon, authenticated;
