-- =====================================================
-- CLEANUP: Eliminar datos existentes y crear tablas caja
-- Ejecutar en orden
-- =====================================================

-- 1. Limpiar datos existentes (respetar FK)
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM damaged_products;
DELETE FROM stock_movements;
DELETE FROM products;

-- 2. Crear tablas caja (si no existen)
CREATE TABLE IF NOT EXISTS caja_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_open_id UUID NOT NULL REFERENCES employees(id),
  employee_close_id UUID REFERENCES employees(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  initial_cash DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_cash DECIMAL(12,2),
  actual_cash DECIMAL(12,2),
  difference DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT
);

ALTER TABLE caja_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS caja_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES caja_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  concept TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  employee_id UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE caja_movements ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies para caja (si no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can read caja_sessions') THEN
    CREATE POLICY "Authenticated can read caja_sessions" ON caja_sessions FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can insert caja_sessions') THEN
    CREATE POLICY "Authenticated can insert caja_sessions" ON caja_sessions FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can update caja_sessions') THEN
    CREATE POLICY "Authenticated can update caja_sessions" ON caja_sessions FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can delete caja_sessions') THEN
    CREATE POLICY "Authenticated can delete caja_sessions" ON caja_sessions FOR DELETE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can read caja_movements') THEN
    CREATE POLICY "Authenticated can read caja_movements" ON caja_movements FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can insert caja_movements') THEN
    CREATE POLICY "Authenticated can insert caja_movements" ON caja_movements FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can delete caja_movements') THEN
    CREATE POLICY "Authenticated can delete caja_movements" ON caja_movements FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- 4. Verificar
SELECT 'Productos eliminados' as resultado;
SELECT 'Tablas caja creadas' as resultado;
