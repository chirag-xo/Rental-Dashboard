-- Inventory Categories
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  supported_lengths JSONB DEFAULT '[]'::jsonb, -- Store raw array of numbers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inventory Items
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.inventory_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  length NUMERIC NOT NULL,
  quantity INTEGER DEFAULT 0,
  weight_per_pc_kg NUMERIC, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Policies (Simple public read/write for now, or authenticated)
-- Adjust based on refined RBAC later. For now match existing "Authenticated" pattern.

CREATE POLICY "Allow authenticated full access to categories" 
ON public.inventory_categories
FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to items" 
ON public.inventory_items
FOR ALL 
USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category_id);
