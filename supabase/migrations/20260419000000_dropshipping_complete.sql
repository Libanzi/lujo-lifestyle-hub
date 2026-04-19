-- ============================================================
-- DROPSHIPPING COMPLETE SCHEMA
-- 1. Suppliers & supplier-product mapping
-- 2. Product variants (size / colour / etc.)
-- 3. Shipping zones & rates
-- 4. Returns / RMA management
-- 5. VAT column on orders
-- 6. Order fulfilment log
-- ============================================================

-- ----------------------------------------------------------------
-- 1. SUPPLIERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  contact_name text,
  email        text,
  phone        text,
  website      text,
  api_endpoint text,
  api_key      text,          -- stored encrypted in production
  notes        text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage suppliers"
  ON public.suppliers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 2. SUPPLIER <-> PRODUCT MAPPING
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_sku    text,
  supplier_cost   numeric(12,2),
  stock_at_supplier integer DEFAULT 0,
  last_synced_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, product_id)
);

ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage supplier_products"
  ON public.supplier_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 3. ORDER FULFILMENT LOG  (which orders were sent to which supplier)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_fulfilment_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier_id     uuid NOT NULL REFERENCES public.suppliers(id),
  sent_at         timestamptz NOT NULL DEFAULT now(),
  supplier_ref    text,        -- supplier's own order number
  tracking_number text,
  status          text NOT NULL DEFAULT 'sent',  -- sent | confirmed | shipped | failed
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_fulfilment_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fulfilment log"
  ON public.order_fulfilment_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 4. PRODUCT VARIANTS  (size / colour / material / etc.)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name           text NOT NULL,   -- e.g. "Size", "Colour"
  value          text NOT NULL,   -- e.g. "XL", "Red"
  sku_suffix     text,            -- appended to parent SKU
  price_modifier numeric(12,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active variants"
  ON public.product_variants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage variants"
  ON public.product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add selected_variant_id to cart_items so cart tracks chosen variant
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id);

-- Add variant_id + variant_label to order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id    uuid REFERENCES public.product_variants(id),
  ADD COLUMN IF NOT EXISTS variant_label text;

-- ----------------------------------------------------------------
-- 5. SHIPPING ZONES & RATES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,           -- e.g. "Gauteng", "Western Cape"
  provinces    text[] NOT NULL,         -- province keywords to match against address
  rate         numeric(12,2) NOT NULL,  -- shipping cost in Rand
  free_above   numeric(12,2),           -- order subtotal above which shipping is free
  estimated_days_min integer DEFAULT 2,
  estimated_days_max integer DEFAULT 5,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shipping zones"
  ON public.shipping_zones FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage shipping zones"
  ON public.shipping_zones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default SA zones
INSERT INTO public.shipping_zones (name, provinces, rate, free_above, estimated_days_min, estimated_days_max)
VALUES
  ('Gauteng',       ARRAY['gauteng','johannesburg','pretoria','ekurhuleni'],     49.00,  500.00, 1, 2),
  ('Western Cape',  ARRAY['western cape','cape town','stellenbosch','paarl'],    59.00,  500.00, 2, 3),
  ('KwaZulu-Natal', ARRAY['kwazulu','kzn','durban','pietermaritzburg'],          69.00,  500.00, 2, 4),
  ('Eastern Cape',  ARRAY['eastern cape','port elizabeth','east london','gqeberha'], 79.00, 600.00, 3, 5),
  ('Other / Remote',ARRAY['limpopo','mpumalanga','north west','free state','northern cape'], 99.00, 700.00, 4, 7)
ON CONFLICT DO NOTHING;

-- Add shipping_cost + vat_amount to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_cost numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_amount    numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_rate      numeric(5,4)  NOT NULL DEFAULT 0.15;

-- ----------------------------------------------------------------
-- 6. RETURNS / RMA
-- ----------------------------------------------------------------
CREATE TYPE IF NOT EXISTS public.return_reason AS ENUM (
  'wrong_item','damaged','not_as_described','changed_mind','other'
);

CREATE TYPE IF NOT EXISTS public.return_status AS ENUM (
  'requested','approved','rejected','received','refunded'
);

CREATE TABLE IF NOT EXISTS public.returns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id   uuid REFERENCES public.order_items(id),
  user_id         uuid NOT NULL,
  reason          public.return_reason NOT NULL DEFAULT 'other',
  reason_detail   text,
  status          public.return_status NOT NULL DEFAULT 'requested',
  refund_amount   numeric(12,2),
  admin_notes     text,
  requested_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own returns"
  ON public.returns FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create returns"
  ON public.returns FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all returns"
  ON public.returns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- Utility: updated_at trigger for suppliers
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS suppliers_updated_at ON public.suppliers;
CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
