-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed JD Rental
INSERT INTO public.organizations (name)
VALUES ('JD Rental')
ON CONFLICT DO NOTHING; -- simple safety

-- 3. Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

INSERT INTO public.roles (name) VALUES
  ('super_admin'),
  ('admin'),
  ('editor'),
  ('viewer')
ON CONFLICT (name) DO NOTHING;

-- 4. Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL
);

INSERT INTO public.permissions (key) VALUES
  ('category.read'),
  ('category.write'),
  ('item.read'),
  ('item.write'),
  ('quotation.read'),
  ('quotation.write'),
  ('user.read'),
  ('user.write'),
  ('settings.manage')
ON CONFLICT (key) DO NOTHING;

-- 5. Users (Hybrid: Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to Supabase Auth
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- Mirrored for easy querying
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Mapping Tables
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 7. Assign Permissions to Roles (Seed)
-- Super Admin: ALL
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin: All except maybe destructive system/billing settings? 
-- For now, let's map Admin to definitions in code or just give them most.
-- Let's stick to the code definitions for exactness, but DB constraints are better.
-- We will seed Common Roles here.

-- Viewers: Read Only
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.key IN ('category.read', 'item.read', 'quotation.read')
WHERE r.name = 'viewer'
ON CONFLICT DO NOTHING;

-- Editors: Read + Write Items/Cats/Quotes
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.key IN (
    'category.read', 'category.write',
    'item.read', 'item.write',
    'quotation.read', 'quotation.write'
)
WHERE r.name = 'editor'
ON CONFLICT DO NOTHING;


-- 8. RLS Policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Super Admins/Admins can view all users (Mock logic, requires recursive Role check which is heavy in RLS)
-- Simplified RLS for Phase 1: 
-- Allow Read if you have a user row (Authenticated)
-- We enforce RBAC in API Middleware mostly. 
-- But for frontend fetching, we need read access.

CREATE POLICY "Allow authenticated read access" ON public.users
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.organizations
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.roles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.permissions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.user_roles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.role_permissions
FOR SELECT USING (auth.role() = 'authenticated');

-- Write Access: Only via Service Role (API) or Super Admin 
-- We leave Write policies empty = deny all (except service role).
