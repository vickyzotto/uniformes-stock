-- =============================================
-- SISTEMA DE STOCK - UNIFORMES
-- Ejecutar este script en Supabase SQL Editor
-- =============================================

-- Depósitos
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO warehouses (name) VALUES ('Depósito 1'), ('Depósito 2');

-- Productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variantes (talle + color)
CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock actual por variante y depósito
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(variant_id, warehouse_id)
);

-- Movimientos (historial completo)
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'transfer', 'price_update')),
  variant_id UUID REFERENCES variants(id) ON DELETE SET NULL,
  from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity INTEGER,
  old_cost DECIMAL(12,2),
  new_cost DECIMAL(12,2),
  old_price DECIMAL(12,2),
  new_price DECIMAL(12,2),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vista completa de stock con info de producto
CREATE VIEW stock_view AS
SELECT
  s.id,
  s.quantity,
  s.variant_id,
  s.warehouse_id,
  w.name AS warehouse_name,
  v.size,
  v.color,
  v.cost,
  v.price,
  p.id AS product_id,
  p.name AS product_name,
  p.category
FROM stock s
JOIN warehouses w ON w.id = s.warehouse_id
JOIN variants v ON v.id = s.variant_id
JOIN products p ON p.id = v.product_id;

-- Vista de movimientos con info completa
CREATE VIEW movements_view AS
SELECT
  m.id,
  m.type,
  m.quantity,
  m.old_cost,
  m.new_cost,
  m.old_price,
  m.new_price,
  m.notes,
  m.created_at,
  v.size,
  v.color,
  p.name AS product_name,
  fw.name AS from_warehouse,
  tw.name AS to_warehouse
FROM movements m
LEFT JOIN variants v ON v.id = m.variant_id
LEFT JOIN products p ON p.id = v.product_id
LEFT JOIN warehouses fw ON fw.id = m.from_warehouse_id
LEFT JOIN warehouses tw ON tw.id = m.to_warehouse_id;

-- Habilitar Row Level Security (RLS) - acceso público para lectura/escritura
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON warehouses FOR ALL USING (true) WITH CHECK (true);
