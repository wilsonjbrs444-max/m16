-- Étape 2b : réglages du site (numéro WhatsApp) + option "titre sur l'image" des bannières.
-- À coller dans Supabase > SQL Editor > Run (une seule fois).

create table if not exists public.site_settings (key text primary key, value text);
alter table public.site_settings enable row level security;
create policy "reglages: lecture" on public.site_settings for select using (true);
create policy "reglages: admin" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

alter table public.banners add column if not exists show_text boolean not null default true;
