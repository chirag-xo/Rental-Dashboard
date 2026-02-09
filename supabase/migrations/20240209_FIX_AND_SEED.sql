-- ==========================================
-- 1. DATABASE SCHEMA SETUP (Run This First)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.organizations (name) VALUES ('JD Rental') ON CONFLICT DO NOTHING;

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

INSERT INTO public.roles (name) VALUES 
  ('super_admin'), ('admin'), ('editor'), ('viewer')
ON CONFLICT (name) DO NOTHING;

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL
);

INSERT INTO public.permissions (key) VALUES
  ('category.read'), ('category.write'),
  ('item.read'), ('item.write'),
  ('quotation.read'), ('quotation.write'),
  ('user.read'), ('user.write'),
  ('settings.manage')
ON CONFLICT (key) DO NOTHING;

-- Users (Hybrid)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mapping Tables
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

-- Seed Role Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p WHERE r.name = 'super_admin' ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key IN ('category.read', 'item.read', 'quotation.read') WHERE r.name = 'viewer' ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key IN ('category.read', 'category.write', 'item.read', 'item.write', 'quotation.read', 'quotation.write') WHERE r.name = 'editor' ON CONFLICT DO NOTHING;


-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.organizations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.user_roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.role_permissions FOR SELECT USING (auth.role() = 'authenticated');


-- ==========================================
-- 2. SEED ADMIN USER (Run This Second)
-- ==========================================

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_role_id UUID;
  v_email TEXT := 'admin@jdrental.com'; -- Change this if needed
BEGIN
  -- 1. Find the Auth User ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User % not found in auth.users. Please create them in Supabase Dashboard -> Authentication first.', v_email;
  ELSE
    -- 2. Get Org ID
    SELECT id INTO v_org_id FROM public.organizations WHERE name = 'JD Rental';

    -- 3. Insert User Profile
    INSERT INTO public.users (id, organization_id, email, is_active)
    VALUES (v_user_id, v_org_id, v_email, true)
    ON CONFLICT (id) DO UPDATE SET is_active = true;

    -- 4. Assign Super Admin Role
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'super_admin';

    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (v_user_id, v_role_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Success: User % is now a Super Admin.', v_email;
  END IF;
END $$;
