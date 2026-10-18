-- À coller dans Supabase > SQL Editor > Run (une seule fois)
create table profiles(id uuid primary key references auth.users on delete cascade, email text, nom text,
  role text not null default 'user' check (role in ('user','membre','admin')), created_at timestamptz default now());
create table candidatures(id bigint generated always as identity primary key, user_id uuid unique not null references auth.users on delete cascade,
  nom text not null, email text, telephone text, message text not null, photo_path text,
  statut text not null default 'en_attente' check (statut in ('en_attente','accepte','refuse')), created_at timestamptz default now());
create table actualites(id bigint generated always as identity primary key, titre text not null, contenu text not null, created_at timestamptz default now());
create table sorties(id bigint generated always as identity primary key, titre text not null, lieu text, description text,
  date_sortie timestamptz not null, created_at timestamptz default now());
create table photos(id bigint generated always as identity primary key, titre text, path text not null, created_at timestamptz default now());
alter table profiles enable row level security; alter table candidatures enable row level security;
alter table actualites enable row level security; alter table sorties enable row level security; alter table photos enable row level security;

create function is_admin() returns boolean language sql security definer set search_path=public stable
as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;
create function is_membre() returns boolean language sql security definer set search_path=public stable
as $$ select exists(select 1 from profiles where id=auth.uid() and role in ('membre','admin')) $$;

-- Création du profil. Les 2 adresses admin ne deviennent admin qu'APRÈS confirmation de leur e-mail.
create function handle_user() returns trigger language plpgsql security definer set search_path=public as $$
declare adm boolean := lower(new.email) in ('tonyblackwolf188@gmail.com','brasko.offi@gmail.com') and new.email_confirmed_at is not null;
begin
  insert into profiles(id,email,nom,role) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'nom',''),case when adm then 'admin' else 'user' end)
  on conflict(id) do update set role=case when adm then 'admin' else profiles.role end;
  return new;
end $$;
create trigger on_auth_user after insert or update of email_confirmed_at on auth.users for each row execute function handle_user();

create policy p_sel on profiles for select using (id=auth.uid() or is_admin());
create policy p_upd on profiles for update using (is_admin()) with check (is_admin());
create policy c_ins on candidatures for insert with check (user_id=auth.uid() and statut='en_attente');
create policy c_sel on candidatures for select using (user_id=auth.uid() or is_admin());
create policy c_upd on candidatures for update using (is_admin()) with check (is_admin());
create policy a_sel on actualites for select using (is_membre()); create policy a_all on actualites for all using (is_admin()) with check (is_admin());
create policy s_sel on sorties for select using (is_membre());    create policy s_all on sorties for all using (is_admin()) with check (is_admin());
create policy f_sel on photos for select using (is_membre());     create policy f_all on photos for all using (is_admin()) with check (is_admin());

insert into storage.buckets(id,name,public) values('photos','photos',true),('candidatures','candidatures',false) on conflict do nothing;
create policy st_photos_w on storage.objects for all using (bucket_id='photos' and is_admin()) with check (bucket_id='photos' and is_admin());
create policy st_cand_i on storage.objects for insert with check (bucket_id='candidatures' and (storage.foldername(name))[1]=auth.uid()::text);
create policy st_cand_u on storage.objects for update using (bucket_id='candidatures' and (storage.foldername(name))[1]=auth.uid()::text);
create policy st_cand_s on storage.objects for select using (bucket_id='candidatures' and ((storage.foldername(name))[1]=auth.uid()::text or is_admin()));
