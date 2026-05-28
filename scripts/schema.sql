-- Crear tabla de empleados (vinculada con auth.users)
CREATE TABLE employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  barcode TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost DECIMAL(12,2) DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  notes TEXT,
  employee_id UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE TABLE damaged_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(12,2) NOT NULL,
  reason TEXT NOT NULL,
  employee_id UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE damaged_products ENABLE ROW LEVEL SECURITY;

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  employee_id UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- RLS policies (todos autenticados pueden leer/escribir)
CREATE POLICY "Authenticated can read employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert employees" ON employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update employees" ON employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete employees" ON employees FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update categories" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete categories" ON categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete products" ON products FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read stock_movements" ON stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert stock_movements" ON stock_movements FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can read damaged_products" ON damaged_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert damaged_products" ON damaged_products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can read sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can read sale_items" ON sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sale_items" ON sale_items FOR INSERT TO authenticated WITH CHECK (true);

-- Función para registrar entrada de stock
CREATE OR REPLACE FUNCTION stock_in(
  p_product_id UUID,
  p_quantity DECIMAL,
  p_notes TEXT DEFAULT NULL,
  p_employee_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE products SET stock = stock + p_quantity WHERE id = p_product_id;
  INSERT INTO stock_movements (product_id, quantity, type, notes, employee_id)
  VALUES (p_product_id, p_quantity, 'in', p_notes, p_employee_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar producto dañado
CREATE OR REPLACE FUNCTION register_damaged(
  p_product_id UUID,
  p_quantity DECIMAL,
  p_reason TEXT,
  p_employee_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE products SET stock = stock - p_quantity WHERE id = p_product_id;
  INSERT INTO damaged_products (product_id, quantity, reason, employee_id)
  VALUES (p_product_id, p_quantity, p_reason, p_employee_id);
  INSERT INTO stock_movements (product_id, quantity, type, notes, employee_id)
  VALUES (p_product_id, p_quantity, 'out', 'Dañado: ' || p_reason, p_employee_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para disminuir stock
CREATE OR REPLACE FUNCTION decrease_stock(
  p_product_id UUID,
  p_quantity DECIMAL
) RETURNS void AS $$
BEGIN
  UPDATE products SET stock = stock - p_quantity WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear empleado automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.employees (id, name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'employee')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
