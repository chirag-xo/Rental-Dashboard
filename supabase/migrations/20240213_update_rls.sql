-- Allow public read access (SELECT) for everyone, including anonymous users
DROP POLICY IF EXISTS "Allow authenticated full access to categories" ON public.inventory_categories;
DROP POLICY IF EXISTS "Allow authenticated full access to items" ON public.inventory_items;

-- Re-create policies
-- 1. Read access for everyone (anon + authenticated)
CREATE POLICY "Allow public read access to categories"
ON public.inventory_categories FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to items"
ON public.inventory_items FOR SELECT
USING (true);

-- 2. Write access (INSERT, UPDATE, DELETE) only for authenticated users
CREATE POLICY "Allow authenticated write access to categories"
ON public.inventory_categories FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to items"
ON public.inventory_items FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
