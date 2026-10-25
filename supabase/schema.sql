-- M16 IT : schéma complet. À coller dans Supabase > SQL Editor > Run.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'client' check (role in ('client','admin')),
  created_at timestamptz default now()
);
create table public.categories (id serial primary key, name text unique not null);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null, specs text, description text,
  price integer not null check (price >= 0),
  old_price integer check (old_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  category_id int references public.categories(id) on delete set null,
  image_url text, badge text,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz default now()
);
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null, subtitle text, image_url text,
  product_id uuid references public.products(id) on delete set null,
  position int not null default 0, active boolean not null default true
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  total integer not null, payment_method text, phone text, address text,
  status text not null default 'Payée (simulation)',
  created_at timestamptz default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id uuid references public.products on delete set null,
  name text not null, price integer not null, qty integer not null check (qty > 0)
);

-- Profil créé automatiquement à l'inscription (rôle client par défaut)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- Sécurité : c'est ICI que l'accès admin est réellement protégé
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "profil: lecture" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "catégories: lecture" on public.categories for select using (true);
create policy "catégories: admin" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "produits: lecture" on public.products for select using (active or public.is_admin());
create policy "produits: admin" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "bannières: lecture" on public.banners for select using (active or public.is_admin());
create policy "bannières: admin" on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy "commandes: créer" on public.orders for insert with check (user_id = auth.uid());
create policy "commandes: lecture" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "commandes: admin" on public.orders for update using (public.is_admin());
create policy "lignes: créer" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "lignes: lecture" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- Stockage des photos d'articles (lecture publique, écriture admin uniquement)
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
create policy "images: lecture" on storage.objects for select using (bucket_id = 'product-images');
create policy "images: ajout admin" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "images: modif admin" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
create policy "images: suppression admin" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());

insert into public.categories (name) values
 ('Ordinateurs'),('Composants'),('Périphériques'),('Réseaux'),('Logiciels'),('Gaming'),('Serveurs et stockage'),('Accessoires');
