-- La'Bella • Agenda Inteligente (esqueleto de banco para Supabase)
-- Não executar antes de revisar dados reais do salão e configurar Auth.
-- Não contém segredos; pode ficar no GitHub público.
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.lb_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.lb_professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true
);
create table if not exists public.lb_services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  duration_minutes integer not null check (duration_minutes between 15 and 600),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 180),
  price_cents integer check (price_cents is null or price_cents >= 0),
  active boolean not null default true
);
create table if not exists public.lb_weekly_hours (
  professional_id uuid not null references public.lb_professionals(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  start_step_minutes smallint not null default 30 check (start_step_minutes in (10,15,20,30,60)),
  primary key(professional_id,weekday),
  check (closes_at>opens_at)
);
create table if not exists public.lb_bookings (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.lb_professionals(id),
  service_id uuid references public.lb_services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','blocked')),
  customer_name text,
  customer_phone text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (status='blocked' or (customer_name is not null and customer_phone is not null)),
  constraint lb_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(starts_at,ends_at,'[)') with &&
  ) where (status in ('confirmed','blocked'))
);

create index if not exists lb_bookings_when on public.lb_bookings(professional_id,starts_at);
create index if not exists lb_bookings_phone on public.lb_bookings(customer_phone);

alter table public.lb_staff enable row level security;
alter table public.lb_professionals enable row level security;
alter table public.lb_services enable row level security;
alter table public.lb_weekly_hours enable row level security;
alter table public.lb_bookings enable row level security;

create or replace function public.lb_is_staff()
returns boolean
language sql stable security definer set search_path=public,pg_temp
as $$ select exists(select 1 from public.lb_staff where user_id=auth.uid()) $$;
revoke all on function public.lb_is_staff() from public;
grant execute on function public.lb_is_staff() to authenticated;

create policy "staff sees own access" on public.lb_staff for select to authenticated using(user_id=auth.uid());
create policy "public reads available services" on public.lb_services for select to anon,authenticated using(active=true);
create policy "staff manages services" on public.lb_services for all to authenticated using(public.lb_is_staff()) with check(public.lb_is_staff());
create policy "staff manages professionals" on public.lb_professionals for all to authenticated using(public.lb_is_staff()) with check(public.lb_is_staff());
create policy "staff manages weekly hours" on public.lb_weekly_hours for all to authenticated using(public.lb_is_staff()) with check(public.lb_is_staff());
create policy "staff manages bookings and blocks" on public.lb_bookings for all to authenticated using(public.lb_is_staff()) with check(public.lb_is_staff());

revoke all on public.lb_staff,public.lb_professionals,public.lb_services,public.lb_weekly_hours,public.lb_bookings from anon,authenticated;
grant select on public.lb_services to anon,authenticated;
grant select,insert,update,delete on public.lb_services,public.lb_professionals,public.lb_weekly_hours,public.lb_bookings to authenticated;
grant select on public.lb_staff to authenticated;

create or replace function public.lb_slots(p_service_id uuid,p_day date,p_professional_id uuid default null)
returns table(slot_start text,slot_end text,state text)
language plpgsql stable security definer set search_path=public,pg_temp
as $$
declare
  v_prof uuid;
  v_duration int;
  v_open int;
  v_close int;
  v_step int;
  v_min int;
  v_start timestamptz;
  v_end timestamptz;
  v_hours public.lb_weekly_hours%rowtype;
begin
  if p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date+90 then return; end if;
  select duration_minutes+buffer_minutes into v_duration from public.lb_services
   where id=p_service_id and active;
  if v_duration is null then return; end if;
  select id into v_prof from public.lb_professionals
    where active and (p_professional_id is null or id=p_professional_id)
    order by name limit 1;
  if v_prof is null then return; end if;
  select * into v_hours from public.lb_weekly_hours
    where professional_id=v_prof and weekday=extract(dow from p_day)::int;
  if not found then return; end if;
  v_open:=extract(hour from v_hours.opens_at)::int*60+extract(minute from v_hours.opens_at)::int;
  v_close:=extract(hour from v_hours.closes_at)::int*60+extract(minute from v_hours.closes_at)::int;
  v_step:=v_hours.start_step_minutes;
  for v_min in v_open..(v_close-1) by v_step loop
    v_start := (p_day::timestamp+make_interval(mins=>v_min)) at time zone 'America/Sao_Paulo';
    v_end := v_start+make_interval(mins=>v_duration);
    slot_start:=to_char(p_day::timestamp+make_interval(mins=>v_min),'HH24:MI');
    slot_end:=to_char(p_day::timestamp+make_interval(mins=>v_min+v_duration),'HH24:MI');
    if v_min+v_duration>v_close or v_start<now() then state:='indisponivel';
    elsif exists (
      select 1 from public.lb_bookings b
      where b.professional_id=v_prof and b.status in ('confirmed','blocked')
        and b.starts_at<v_end and b.ends_at>v_start
    ) then state:='ocupado';
    else state:='livre';
    end if;
    return next;
  end loop;
end $$;

create or replace function public.lb_reserve(
  p_service_id uuid,p_day date,p_start text,
  p_name text,p_phone text,p_professional_id uuid default null
) returns uuid
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_prof uuid;
  v_duration int;
  v_start timestamptz;
  v_id uuid;
begin
  if length(trim(p_name)) not between 2 and 80
    or length(regexp_replace(p_phone,'\D','','g')) not between 10 and 13 then
    raise exception 'Nome ou telefone inválido';
  end if;
  if p_start !~ '^\d{2}:\d{2}$' then raise exception 'Horário inválido'; end if;
  if p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date+90 then
    raise exception 'Data fora do intervalo permitido';
  end if;
  select id into v_prof from public.lb_professionals
    where active and (p_professional_id is null or id=p_professional_id)
    order by name limit 1;
  select duration_minutes+buffer_minutes into v_duration from public.lb_services
    where id=p_service_id and active;
  if v_prof is null or v_duration is null then raise exception 'Serviço indisponível'; end if;
  -- Serializa tentativas para a mesma profissional e dia; exclusion constraint protege também.
  perform pg_advisory_xact_lock(hashtext(v_prof::text),hashtext(p_day::text));
  if not exists (
    select 1 from public.lb_slots(p_service_id,p_day,v_prof) sl
    where sl.slot_start=p_start and sl.state='livre'
  ) then raise exception 'Horário ocupado ou fora do expediente'; end if;
  v_start := (p_day + p_start::time) at time zone 'America/Sao_Paulo';
  -- Limite simples por telefone; colocar CAPTCHA/rate limit na borda antes de abrir ao público.
  if (select count(*) from public.lb_bookings b where b.customer_phone=regexp_replace(p_phone,'\D','','g')
    and b.created_at>now()-interval '24 hours' and b.status='confirmed')>=3 then
    raise exception 'Limite de reservas por telefone; fale com o salão';
  end if;
  insert into public.lb_bookings(professional_id,service_id,starts_at,ends_at,status,customer_name,customer_phone)
  values(v_prof,p_service_id,v_start,v_start+make_interval(mins=>v_duration),'confirmed',
    trim(p_name),regexp_replace(p_phone,'\D','','g'))
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.lb_slots(uuid,date,uuid) from public;
revoke all on function public.lb_reserve(uuid,date,text,text,text,uuid) from public;
grant execute on function public.lb_slots(uuid,date,uuid) to anon,authenticated;
grant execute on function public.lb_reserve(uuid,date,text,text,text,uuid) to anon,authenticated;

-- Valores de exemplo: substituir horários e duração após aprovação da proprietária.
insert into public.lb_professionals(name) values ('Profissional 1') on conflict(name) do nothing;
insert into public.lb_services(name,duration_minutes) values
 ('Alisamento capilar',180),('Cortes e estilo',45),
 ('Cor e brilho',120),('Cuidados e finalização',60)
on conflict(name) do nothing;
insert into public.lb_weekly_hours(professional_id,weekday,opens_at,closes_at,start_step_minutes)
select p.id,day.w,'09:00'::time,'18:00'::time,30
from public.lb_professionals p cross join (values (1),(2),(3),(4),(5)) as day(w)
where p.name='Profissional 1'
on conflict(professional_id,weekday) do nothing;
-- CADASTRAR PROPRIETÁRIA: após o primeiro login Supabase Auth,
-- inserir seu auth.users.id em public.lb_staff usando SQL Editor (não no navegador).
