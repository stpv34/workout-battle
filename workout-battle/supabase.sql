-- Workout Battle schema. Paste all of this into Supabase > SQL Editor > Run.
create table profiles(id uuid primary key references auth.users on delete cascade, name text not null default 'Lifter', bodyweight numeric, exercises jsonb not null default '[]', created_at timestamptz default now());
create table sessions(id text primary key, user_id uuid not null references profiles on delete cascade, date date not null, day text not null, saved_at timestamptz not null default now(), entries jsonb not null default '[]');
create index on sessions(user_id,date);
create table circles(id uuid primary key default gen_random_uuid(), name text not null, invite_code text unique not null default substr(md5(random()::text||clock_timestamp()::text),1,8), owner uuid references profiles, created_at timestamptz default now());
create table circle_members(circle_id uuid references circles on delete cascade, user_id uuid references profiles on delete cascade, joined_at timestamptz default now(), primary key(circle_id,user_id));
alter table profiles enable row level security; alter table sessions enable row level security; alter table circles enable row level security; alter table circle_members enable row level security;
create policy "own profile" on profiles for all using(id=auth.uid()) with check(id=auth.uid());
create policy "own sessions" on sessions for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "my memberships" on circle_members for select using(user_id=auth.uid());
create policy "my circles" on circles for select using(id in (select circle_id from circle_members where user_id=auth.uid()));
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id,name) values(new.id,split_part(new.email,'@',1)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
create function create_circle(cname text) returns circles language plpgsql security definer set search_path=public as $$ declare c circles; begin insert into circles(name,owner) values(left(trim(cname),40),auth.uid()) returning * into c; insert into circle_members(circle_id,user_id) values(c.id,auth.uid()); return c; end $$;
create function join_circle(code text) returns uuid language plpgsql security definer set search_path=public as $$ declare cid uuid; begin select id into cid from circles where invite_code=lower(trim(code)); if cid is null then raise exception 'Invalid invite code'; end if; insert into circle_members(circle_id,user_id) values(cid,auth.uid()) on conflict do nothing; return cid; end $$;
create function circle_leaderboard(cid uuid, since date default date_trunc('week',current_date)::date)
returns table(user_id uuid, name text, workouts int, streak int, improvement int, bw_bonus int, score int, xp int, level int)
language sql security definer set search_path=public stable as $$
with m as (select cm.user_id from circle_members cm where cm.circle_id=cid and exists(select 1 from circle_members me where me.circle_id=cid and me.user_id=auth.uid())),
sr as (select s.user_id, s.date, en->>'ex' as ex, (st->>'w')::numeric as w, (st->>'r')::numeric as r from sessions s join m on m.user_id=s.user_id cross join lateral jsonb_array_elements(s.entries) en cross join lateral jsonb_array_elements(en->'sets') st where st->>'w' is not null and st->>'r' is not null),
e as (select user_id,date,ex,w*(1+r/30.0) as e1 from sr where w>0 and r>0),
cur as (select user_id,ex,max(e1) as b from e where date>=since group by 1,2),
prev as (select user_id,ex,max(e1) as b from e where date<since and date>=since-56 group by 1,2),
imp as (select c.user_id, least(150,sum(least(25,greatest(0,(c.b/p.b-1)*100))))::int as pts from cur c join prev p using(user_id,ex) group by 1),
topb as (select user_id,max(b) as b from cur group by 1),
wkc as (select s.user_id,count(*)::int as n from sessions s join m using(user_id) where s.date>=since group by 1),
tot as (select s.user_id,count(*)::int as n from sessions s join m using(user_id) group by 1),
vol as (select user_id,sum(w*r) as v from sr group by 1),
weeks as (select distinct s.user_id,date_trunc('week',s.date)::date as wk from sessions s join m using(user_id)),
isl as (select user_id,wk,wk-((row_number() over(partition by user_id order by wk))::int*7) as g from weeks),
grp as (select user_id,count(*)::int as n,max(wk) as lastwk from isl group by user_id,g),
stk as (select user_id,max(n) as n from grp where lastwk>=date_trunc('week',current_date)::date-7 group by 1),
f as (select p.id as uid, p.name as nm, coalesce(wkc.n,0) as w, coalesce(stk.n,0) as sk, coalesce(imp.pts,0) as ip,
 case when p.bodyweight>0 then least(50,round(10*coalesce(topb.b,0)/p.bodyweight))::int else 0 end as bb,
 (coalesce(tot.n,0)*50+coalesce(vol.v,0)/200)::int as x
 from m join profiles p on p.id=m.user_id left join wkc on wkc.user_id=p.id left join stk on stk.user_id=p.id left join imp on imp.user_id=p.id left join topb on topb.user_id=p.id left join tot on tot.user_id=p.id left join vol on vol.user_id=p.id)
select uid,nm,w,sk,ip,bb,(least(w,5)*50+sk*10+ip+bb)::int,x,(floor(sqrt(x/100.0))+1)::int from f order by 7 desc, 2
$$;
