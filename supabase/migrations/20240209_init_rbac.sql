-- Create a private "app_role" enum type
create type public.app_role as enum ('admin', 'editor', 'viewer');

-- Create a table for public profiles
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text not null,
  role public.app_role not null default 'viewer',
  is_active boolean not null default true,
  organization_id uuid, -- For future multi-tenancy
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (id)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies

-- 1. Viewers can view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- 2. Admins can view all profiles
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3. Admins can update profiles (promote/demote/deactivate)
create policy "Admins can update profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Function to handle new user signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, is_active)
  values (new.id, new.email, 'viewer', true);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
