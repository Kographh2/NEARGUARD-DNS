begin;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists blocked_events_trim on public.blocked_events;
drop trigger if exists profiles_protect_fields on public.profiles;
drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists devices_set_updated_at on public.devices;
drop trigger if exists device_ips_set_updated_at on public.device_ips;
drop trigger if exists rate_limit_config_set_updated_at on public.rate_limit_config;
drop trigger if exists rate_limit_overrides_set_updated_at on public.rate_limit_overrides;
drop trigger if exists admin_security_set_updated_at on public.admin_security;
drop trigger if exists app_settings_set_updated_at on public.app_settings;

drop function if exists public.handle_new_user();
drop function if exists public.protect_profile_fields();
drop function if exists public.trim_blocked_events();
drop function if exists public.set_updated_at();
 
drop table if exists public.ip_reveal_audit cascade;
drop table if exists public.admin_security cascade;
drop table if exists public.rate_limit_overrides cascade;
drop table if exists public.rate_limit_config cascade;
drop table if exists public.app_settings cascade;
drop table if exists public.blocked_events cascade;
drop table if exists public.blocked_domains_daily cascade;
drop table if exists public.usage_daily cascade;
drop table if exists public.device_ips cascade;
drop table if exists public.devices cascade;
drop table if exists public.profiles cascade;

commit;
