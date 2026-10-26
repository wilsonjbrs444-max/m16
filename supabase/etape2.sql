-- Étape 2 : plusieurs photos par produit + paramètres du profil.
-- À coller dans Supabase > SQL Editor > Run (une seule fois).

alter table public.products add column if not exists images text[] not null default '{}';
update public.products set images = array[image_url] where image_url is not null and cardinality(images) = 0;

alter table public.profiles add column if not exists phone text, add column if not exists address text;

-- Un client ne peut modifier QUE son nom, son téléphone et son adresse (jamais son rôle).
create or replace function public.update_my_profile(p_name text, p_phone text, p_address text)
returns void language sql security definer set search_path = public as $$
  update public.profiles set full_name = p_name, phone = p_phone, address = p_address where id = auth.uid();
$$;
revoke all on function public.update_my_profile(text, text, text) from public;
grant execute on function public.update_my_profile(text, text, text) to authenticated;
