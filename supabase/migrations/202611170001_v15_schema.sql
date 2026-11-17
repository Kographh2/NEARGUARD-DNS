-- NEAR ADGUARD v1.5 schema.
-- This migration is idempotent. Apply it in one transaction with
-- scripts/apply-migration.ts. It does not drop tables, truncate data, delete
-- rows, drop the schema, or modify auth.users rows.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  username text not null check (
    username = lower(username)
    and username ~ '^[a-z][a-z0-9_-]{2,19}$'
  ),
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  log_blocked boolean not null default true,
  categories integer not null default 63
    constraint profiles_categories_check check (categories between 0 and 127),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_key unique (username)
);

alter table public.profiles
  add column if not exists categories integer not null default 63;
alter table public.profiles
  alter column categories set default 63;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'profiles_categories_check'
       and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_categories_check
      check (categories between 0 and 127);
  end if;
end
$$;

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'registered')),
  label text check (
    label is null
    or (label = lower(label) and label ~ '^[a-z0-9][a-z0-9_-]{0,39}$')
  ),
  client_hash text not null check (char_length(client_hash) between 16 and 128),
  ua_family text,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  constraint devices_tier_owner_check check (
    (tier = 'free' and user_id is null)
    or (tier = 'registered' and user_id is not null)
  )
);

create index if not exists devices_user_last_seen_idx
  on public.devices (user_id, last_seen desc);
create unique index if not exists devices_user_client_hash_idx
  on public.devices (user_id, client_hash)
  where user_id is not null;
create unique index if not exists devices_free_client_hash_idx
  on public.devices (client_hash)
  where user_id is null;
create unique index if not exists devices_user_label_idx
  on public.devices (user_id, label)
  where user_id is not null and label is not null;

create table if not exists public.device_ips (
  device_id uuid primary key references public.devices(id) on delete cascade,
  ip_enc text not null,
  ip_hmac text not null,
  ip_family smallint not null check (ip_family in (4, 6)),
  updated_at timestamptz not null default now()
);

create index if not exists device_ips_ip_hmac_idx
  on public.device_ips (ip_hmac);

create table if not exists public.usage_daily (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  device_id uuid,
  day date not null default current_date,
  requests bigint not null default 0 check (requests >= 0),
  blocked bigint not null default 0 check (blocked >= 0),
  rate_limited bigint not null default 0 check (rate_limited >= 0),
  constraint usage_daily_owner_check check (
    user_id is not null or device_id is not null
  )
);

create unique index if not exists usage_daily_user_day_idx
  on public.usage_daily (user_id, day)
  where device_id is null;
create unique index if not exists usage_daily_device_day_idx
  on public.usage_daily (device_id, day)
  where device_id is not null;
create index if not exists usage_daily_day_idx
  on public.usage_daily (day);

create table if not exists public.blocked_domains_daily (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default current_date,
  domain text not null check (char_length(domain) between 1 and 253),
  count bigint not null default 0 check (count >= 0),
  category smallint not null default 0
    constraint blocked_domains_daily_category_check check (category between 0 and 127),
  primary key (user_id, day, domain)
);

alter table public.blocked_domains_daily
  add column if not exists category smallint not null default 0;
alter table public.blocked_domains_daily
  alter column category set default 0;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'blocked_domains_daily_category_check'
       and conrelid = 'public.blocked_domains_daily'::regclass
  ) then
    alter table public.blocked_domains_daily
      add constraint blocked_domains_daily_category_check
      check (category between 0 and 127);
  end if;
end
$$;

create index if not exists blocked_domains_daily_user_day_count_idx
  on public.blocked_domains_daily (user_id, day, count desc);

create table if not exists public.blocked_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  domain text not null check (char_length(domain) between 1 and 253),
  qtype integer not null check (qtype between 0 and 65535),
  category smallint not null default 0
    constraint blocked_events_category_check check (category between 0 and 127),
  at timestamptz not null default now()
);

alter table public.blocked_events
  add column if not exists category smallint not null default 0;
alter table public.blocked_events
  alter column category set default 0;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'blocked_events_category_check'
       and conrelid = 'public.blocked_events'::regclass
  ) then
    alter table public.blocked_events
      add constraint blocked_events_category_check
      check (category between 0 and 127);
  end if;
end
$$;

create index if not exists blocked_events_user_at_idx
  on public.blocked_events (user_id, at desc);

create table if not exists public.rate_limit_config (
  tier text primary key check (tier in ('free', 'user')),
  per_minute integer not null check (per_minute > 0),
  per_day integer not null check (per_day > 0),
  updated_at timestamptz not null default now()
);

insert into public.rate_limit_config (tier, per_minute, per_day)
values ('free', 120, 3000), ('user', 200, 8000)
on conflict (tier) do nothing;

create table if not exists public.rate_limit_overrides (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  per_minute integer check (per_minute is null or per_minute > 0),
  per_day integer check (per_day is null or per_day > 0),
  updated_at timestamptz not null default now(),
  constraint rate_limit_overrides_any_check check (
    per_minute is not null or per_day is not null
  )
);

create table if not exists public.admin_security (
  admin_id uuid primary key references public.profiles(id) on delete cascade,
  pin_hash text not null,
  pin_updated_at timestamptz not null default now(),
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ip_reveal_audit (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null check (scope in ('device', 'page', 'all')),
  at timestamptz not null default now(),
  expires_at timestamptz not null,
  ip_of_admin_enc text,
  constraint ip_reveal_audit_expiry_check check (expires_at > at)
);

create index if not exists ip_reveal_audit_admin_at_idx
  on public.ip_reveal_audit (admin_id, at desc);

create table if not exists public.app_settings (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values
  ('retention_blocked_events_days', '14'::jsonb),
  ('retention_usage_daily_days', '90'::jsonb),
  ('retention_idle_devices_days', '30'::jsonb),
  ('default_categories', '63'::jsonb),
  ('decoy_rotation_seconds', '600'::jsonb),
  ('blocked_events_per_user_max', '500'::jsonb),
  ('admin_pin_max_failed_attempts', '5'::jsonb),
  ('admin_pin_lockout_minutes', '15'::jsonb),
  ('reveal_session_seconds', '300'::jsonb),
  ('new_devices_per_hour', '20'::jsonb),
  ('unknown_per_minute', '20'::jsonb),
  ('registered_ip_per_minute', '300'::jsonb),
  ('device_per_minute', '100'::jsonb),
  ('hobby_monthly_invocations', '1000000'::jsonb),
  ('circuit_breaker_free_soft', '0.60'::jsonb),
  ('circuit_breaker_free_hard', '0.75'::jsonb),
  ('circuit_breaker_registered', '0.90'::jsonb),
  ('circuit_breaker_all', '0.95'::jsonb),
  ('block_mode', '"NXDOMAIN"'::jsonb)
on conflict (key) do nothing;

comment on column public.profiles.categories is
  'Category bitmask: 1 ads, 2 trackers, 4 malware, 8 phishing, 16 scam, 32 crypto-scam, 64 gambling. Default 63 keeps gambling off.';
comment on column public.blocked_domains_daily.category is
  'Block category bit: 1 ads, 2 trackers, 4 malware, 8 phishing, 16 scam, 32 crypto-scam, 64 gambling.';
comment on column public.blocked_events.category is
  'Block category bit: 1 ads, 2 trackers, 4 malware, 8 phishing, 16 scam, 32 crypto-scam, 64 gambling.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_reserved_username(p_value text)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    lower(trim(p_value)) = any (
      array[
        'admin', 'api', 'dashboard', 'login', 'register', 'logout',
        'dns-query', 'privacy', 'nearguard', 'nearguard.mobileconfig',
        '_next', 'static', 'assets', 'favicon.ico', 'robots.txt',
        'sitemap.xml', 'support', 'help', 'root', 'system', 'null',
        'undefined', 'forgot-password', 'reset-password', 'auth',
        'callback', 'device', 'devices', 'settings', 'profile', 'security',
        'billing', 'terms', 'about', 'contact', 'status', 'health', 'test',
        'test-block', 'install', 'faq', 'docs', 'blog', 'changelog',
        'pricing', 'features', 'how-it-works', 'welcome', 'verify',
        'confirm', 'unsubscribe', 'account', 'accounts', 'signin', 'signup',
        'sign-in', 'sign-up', 'user', 'users', 'me', 'app', 'www', 'mail',
        'smtp', 'imap', 'pop', 'dns', 'doh', 'resolve', 'resolver', 'query',
        'mobileconfig', 'apple', 'ios', 'macos', 'android', 'windows',
        'linux', 'cdn', 'edge', 'function', 'functions', 'cron', 'webhook',
        'webhooks', 'ops', 'internal', 'private', 'public', 'new', 'edit',
        'delete', 'create', 'update', 'search', 'explore', 'download',
        'downloads', 'upload', 'uploads', 'files', 'file', 'images', 'image',
        'media', 'video', 'audio', 'music', 'news', 'events', 'event',
        'stats', 'statistics', 'analytics', 'metrics', 'monitor',
        'monitoring', 'logs', 'log', 'audit', 'reports', 'report', 'export',
        'import', 'backup', 'backups', 'restore', 'maintenance', 'upgrade',
        'updates', 'release', 'releases', 'beta', 'alpha', 'preview',
        'staging', 'prod', 'production', 'dev', 'development', 'sandbox',
        'demo', 'example', 'sample', 'documentation', 'guide', 'guides',
        'manual', 'license', 'licenses', 'legal', 'copyright', 'dmca',
        'abuse', 'security.txt', 'humans.txt', 'manifest.json',
        'apple-touch-icon.png', 'icon.svg', 'opengraph-image.png',
        'twitter-image.png', 'favicon.svg', '404', '500', 'error',
        'not-found', 'loading', 'layout', 'page', 'route', 'template',
        'default', 'global-error', 'sitemap', 'robots', 'manifest', 'icon'
      ]::text[]
    ),
    false
  );
$$;

create or replace function public.validate_profile_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.username := lower(trim(new.username));

  if new.username is null
    or new.username !~ '^[a-z][a-z0-9_-]{2,19}$' then
    raise exception 'Invalid username'
      using errcode = '22023';
  end if;

  if public.is_reserved_username(new.username) then
    raise exception 'Username is reserved'
      using errcode = '22023';
  end if;

  if exists (
    select 1
      from public.profiles
     where lower(username) = new.username
       and id <> new.id
  ) then
    raise exception 'Username is already taken'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_username text;
  email_base text;
begin
  profile_name := nullif(trim(new.raw_user_meta_data->>'name'), '');
  profile_username := lower(nullif(trim(new.raw_user_meta_data->>'username'), ''));

  if profile_username is null then
    email_base := regexp_replace(
      lower(split_part(coalesce(new.email, ''), '@', 1)),
      '[^a-z0-9_-]',
      '',
      'g'
    );

    if email_base ~ '^[a-z][a-z0-9_-]{2,19}$'
      and not public.is_reserved_username(email_base)
      and not exists (
        select 1
          from public.profiles
         where lower(username) = email_base
      ) then
      profile_username := email_base;
    else
      profile_username := 'user-' || substr(replace(new.id::text, '-', ''), 1, 15);
    end if;
  end if;

  if profile_username !~ '^[a-z][a-z0-9_-]{2,19}$' then
    raise exception 'Invalid username'
      using errcode = '22023';
  end if;

  if public.is_reserved_username(profile_username) then
    raise exception 'Username is reserved'
      using errcode = '22023';
  end if;

  if profile_name is null then
    profile_name := coalesce(profile_username, 'user');
  end if;

  insert into public.profiles (id, name, username)
  values (new.id, left(profile_name, 100), profile_username);

  return new;
exception
  when unique_violation then
    raise exception 'Username is already taken'
      using errcode = '23505';
end;
$$;

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := coalesce(
    current_setting('request.jwt.claim.role', true),
    current_setting('role', true)
  );

  if auth.uid() is not null
    and v_role is distinct from 'service_role' then
    if new.id is distinct from old.id
      or new.username is distinct from old.username
      or new.role is distinct from old.role
      or new.status is distinct from old.status then
      raise exception 'Protected profile fields cannot be changed by clients'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.trim_blocked_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  max_rows integer;
begin
  select coalesce((value #>> '{}')::integer, 500)
    into max_rows
    from public.app_settings
   where key = 'blocked_events_per_user_max';

  if max_rows is null or max_rows < 1 then
    max_rows := 500;
  end if;

  delete from public.blocked_events
   where id in (
     select id
       from public.blocked_events
      where user_id = new.user_id
      order by at desc, id desc
      offset max_rows
   );

  return new;
end;
$$;

create or replace function public.flush_dns_counters(
  p_usage jsonb default '[]'::jsonb,
  p_blocked_domains jsonb default '[]'::jsonb,
  p_blocked_events jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  v_user uuid;
  v_device uuid;
  v_day date;
  v_requests bigint;
  v_blocked bigint;
  v_rate_limited bigint;
  v_domain text;
  v_category smallint;
  v_count bigint;
  v_qtype integer;
  v_at timestamptz;
begin
  for item in
    select *
      from jsonb_array_elements(coalesce(p_usage, '[]'::jsonb))
  loop
    v_user := nullif(item->>'user_id', '')::uuid;
    v_device := nullif(item->>'device_id', '')::uuid;
    v_day := coalesce(nullif(item->>'day', '')::date, current_date);
    v_requests := greatest(coalesce((item->>'requests')::bigint, 0), 0);
    v_blocked := greatest(coalesce((item->>'blocked')::bigint, 0), 0);
    v_rate_limited := greatest(
      coalesce((item->>'rate_limited')::bigint, 0),
      0
    );

    if v_requests = 0 and v_blocked = 0 and v_rate_limited = 0 then
      continue;
    end if;

    if v_device is not null then
      insert into public.usage_daily
        (user_id, device_id, day, requests, blocked, rate_limited)
      values
        (v_user, v_device, v_day, v_requests, v_blocked, v_rate_limited)
      on conflict (device_id, day) where device_id is not null
      do update set
        requests = usage_daily.requests + excluded.requests,
        blocked = usage_daily.blocked + excluded.blocked,
        rate_limited = usage_daily.rate_limited + excluded.rate_limited;
    elsif v_user is not null then
      insert into public.usage_daily
        (user_id, device_id, day, requests, blocked, rate_limited)
      values
        (v_user, null, v_day, v_requests, v_blocked, v_rate_limited)
      on conflict (user_id, day) where device_id is null
      do update set
        requests = usage_daily.requests + excluded.requests,
        blocked = usage_daily.blocked + excluded.blocked,
        rate_limited = usage_daily.rate_limited + excluded.rate_limited;
    end if;
  end loop;

  for item in
    select *
      from jsonb_array_elements(coalesce(p_blocked_domains, '[]'::jsonb))
  loop
    v_user := nullif(item->>'user_id', '')::uuid;
    v_day := coalesce(nullif(item->>'day', '')::date, current_date);
    v_domain := nullif(trim(item->>'domain'), '');
    v_count := greatest(coalesce((item->>'count')::bigint, 0), 0);
    v_category := least(
      greatest(coalesce((item->>'category')::smallint, 0::smallint), 0::smallint),
      127::smallint
    );

    if v_user is null or v_domain is null or v_count = 0 then
      continue;
    end if;

    insert into public.blocked_domains_daily
      (user_id, day, domain, count, category)
    values
      (v_user, v_day, v_domain, v_count, v_category)
    on conflict (user_id, day, domain)
    do update set
      count = blocked_domains_daily.count + excluded.count,
      category = excluded.category;
  end loop;

  for item in
    select *
      from jsonb_array_elements(coalesce(p_blocked_events, '[]'::jsonb))
  loop
    v_user := nullif(item->>'user_id', '')::uuid;
    v_device := nullif(item->>'device_id', '')::uuid;
    v_domain := nullif(trim(item->>'domain'), '');
    v_qtype := least(
      greatest(coalesce((item->>'qtype')::integer, 0), 0),
      65535
    );
    v_category := least(
      greatest(coalesce((item->>'category')::smallint, 0::smallint), 0::smallint),
      127::smallint
    );
    v_at := coalesce(nullif(item->>'at', '')::timestamptz, now());

    if v_user is null or v_domain is null then
      continue;
    end if;

    insert into public.blocked_events
      (user_id, device_id, domain, qtype, category, at)
    values
      (v_user, v_device, v_domain, v_qtype, v_category, v_at);
  end loop;
end;
$$;

comment on function public.flush_dns_counters(jsonb, jsonb, jsonb) is
  'One service-role RPC for batched usage counters, blocked-domain aggregates, and capped blocked events.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();

drop trigger if exists device_ips_set_updated_at on public.device_ips;
create trigger device_ips_set_updated_at
  before update on public.device_ips
  for each row execute function public.set_updated_at();

drop trigger if exists rate_limit_config_set_updated_at on public.rate_limit_config;
create trigger rate_limit_config_set_updated_at
  before update on public.rate_limit_config
  for each row execute function public.set_updated_at();

drop trigger if exists rate_limit_overrides_set_updated_at on public.rate_limit_overrides;
create trigger rate_limit_overrides_set_updated_at
  before update on public.rate_limit_overrides
  for each row execute function public.set_updated_at();

drop trigger if exists admin_security_set_updated_at on public.admin_security;
create trigger admin_security_set_updated_at
  before update on public.admin_security
  for each row execute function public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_validate_username on public.profiles;
create trigger profiles_validate_username
  before insert or update of username on public.profiles
  for each row execute function public.validate_profile_username();

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

drop trigger if exists blocked_events_trim on public.blocked_events;
create trigger blocked_events_trim
  after insert on public.blocked_events
  for each row execute function public.trim_blocked_events();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare
  auth_user record;
  profile_name text;
  profile_username text;
  suffix integer;
begin
  for auth_user in
    select id, raw_user_meta_data
      from auth.users
  loop
    if exists (
      select 1
        from public.profiles
       where id = auth_user.id
    ) then
      continue;
    end if;

    profile_name := nullif(trim(auth_user.raw_user_meta_data->>'name'), '');
    profile_username := lower(
      nullif(trim(auth_user.raw_user_meta_data->>'username'), '')
    );

    if profile_username is null
      or profile_username !~ '^[a-z][a-z0-9_-]{2,19}$'
      or public.is_reserved_username(profile_username)
      or exists (
        select 1
          from public.profiles
         where lower(username) = profile_username
      ) then
      profile_username :=
        'user-' || substr(replace(auth_user.id::text, '-', ''), 1, 15);
      suffix := 0;

      while exists (
        select 1
          from public.profiles
         where lower(username) = profile_username
      ) loop
        suffix := suffix + 1;
        profile_username :=
          'user-' || substr(replace(auth_user.id::text, '-', ''), 1, 12)
          || '-' || suffix::text;
      end loop;
    end if;

    if profile_name is null then
      profile_name := coalesce(profile_username, 'user');
    end if;

    insert into public.profiles (id, name, username)
    values (auth_user.id, left(profile_name, 100), profile_username);
  end loop;
end
$$;

alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.device_ips enable row level security;
alter table public.usage_daily enable row level security;
alter table public.blocked_domains_daily enable row level security;
alter table public.blocked_events enable row level security;
alter table public.rate_limit_config enable row level security;
alter table public.rate_limit_overrides enable row level security;
alter table public.admin_security enable row level security;
alter table public.ip_reveal_audit enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists devices_select_own on public.devices;
create policy devices_select_own
  on public.devices
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists usage_daily_select_own on public.usage_daily;
create policy usage_daily_select_own
  on public.usage_daily
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists blocked_domains_daily_select_own on public.blocked_domains_daily;
create policy blocked_domains_daily_select_own
  on public.blocked_domains_daily
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists blocked_events_select_own on public.blocked_events;
create policy blocked_events_select_own
  on public.blocked_events
  for select
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.devices from anon, authenticated;
revoke all on table public.device_ips from anon, authenticated;
revoke all on table public.usage_daily from anon, authenticated;
revoke all on table public.blocked_domains_daily from anon, authenticated;
revoke all on table public.blocked_events from anon, authenticated;
revoke all on table public.rate_limit_config from anon, authenticated;
revoke all on table public.rate_limit_overrides from anon, authenticated;
revoke all on table public.admin_security from anon, authenticated;
revoke all on table public.ip_reveal_audit from anon, authenticated;
revoke all on table public.app_settings from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema public to supabase_auth_admin;

grant select on table public.profiles to authenticated;
grant update (name, log_blocked, categories) on table public.profiles to authenticated;
grant select on table public.devices to authenticated;
grant select on table public.usage_daily to authenticated;
grant select on table public.blocked_domains_daily to authenticated;
grant select on table public.blocked_events to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.is_reserved_username(text) from public, anon, authenticated;
revoke all on function public.validate_profile_username() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_fields() from public, anon, authenticated;
revoke all on function public.trim_blocked_events() from public, anon, authenticated;
revoke all on function public.flush_dns_counters(jsonb, jsonb, jsonb)
  from public, anon, authenticated;

grant execute on function public.set_updated_at() to authenticated, service_role;
grant execute on function public.is_reserved_username(text) to service_role;
grant execute on function public.validate_profile_username() to service_role;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;
grant execute on function public.protect_profile_fields() to authenticated, service_role;
grant execute on function public.trim_blocked_events() to service_role;
grant execute on function public.flush_dns_counters(jsonb, jsonb, jsonb)
  to service_role;
