create extension if not exists pgcrypto;

create table if not exists public.kitchen_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scan_uploads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.kitchen_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'failed')),
  source_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scene_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.kitchen_projects(id) on delete cascade,
  scan_id uuid references public.scan_uploads(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  splat_path text,
  mesh_path text,
  scale_reference jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.equipment_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.kitchen_projects(id) on delete cascade,
  scene_version_id uuid references public.scene_versions(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  dimensions_mm jsonb not null default '{}'::jsonb,
  transform jsonb not null default '{}'::jsonb,
  asset_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kitchen_projects enable row level security;
alter table public.scan_uploads enable row level security;
alter table public.scene_versions enable row level security;
alter table public.equipment_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kitchen_projects' and policyname = 'projects_select_own') then
    create policy "projects_select_own" on public.kitchen_projects for select using (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kitchen_projects' and policyname = 'projects_insert_own') then
    create policy "projects_insert_own" on public.kitchen_projects for insert with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kitchen_projects' and policyname = 'projects_update_own') then
    create policy "projects_update_own" on public.kitchen_projects for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kitchen_projects' and policyname = 'projects_delete_own') then
    create policy "projects_delete_own" on public.kitchen_projects for delete using (auth.uid() = owner_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scan_uploads' and policyname = 'scans_select_own') then
    create policy "scans_select_own" on public.scan_uploads for select using (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scan_uploads' and policyname = 'scans_insert_own') then
    create policy "scans_insert_own" on public.scan_uploads for insert with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scan_uploads' and policyname = 'scans_update_own') then
    create policy "scans_update_own" on public.scan_uploads for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scan_uploads' and policyname = 'scans_delete_own') then
    create policy "scans_delete_own" on public.scan_uploads for delete using (auth.uid() = owner_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scene_versions' and policyname = 'scenes_select_own') then
    create policy "scenes_select_own" on public.scene_versions for select using (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scene_versions' and policyname = 'scenes_insert_own') then
    create policy "scenes_insert_own" on public.scene_versions for insert with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scene_versions' and policyname = 'scenes_delete_own') then
    create policy "scenes_delete_own" on public.scene_versions for delete using (auth.uid() = owner_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'equipment_items' and policyname = 'equipment_select_own') then
    create policy "equipment_select_own" on public.equipment_items for select using (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'equipment_items' and policyname = 'equipment_insert_own') then
    create policy "equipment_insert_own" on public.equipment_items for insert with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'equipment_items' and policyname = 'equipment_update_own') then
    create policy "equipment_update_own" on public.equipment_items for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'equipment_items' and policyname = 'equipment_delete_own') then
    create policy "equipment_delete_own" on public.equipment_items for delete using (auth.uid() = owner_id);
  end if;
end $$;
