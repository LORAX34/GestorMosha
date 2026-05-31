-- =====================================================
-- SEED: Crear usuario admin, categorías y productos
-- Ejecutar esto en el SQL Editor de Supabase
-- =====================================================

-- 1. Crear usuario en auth.users
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_sent_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'mosha@seed.com',
  crypt('Mosha04*', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Mosha"}',
  now(), now(),
  '', '', '', ''
);

-- 2. Actualizar empleado creado por el trigger
UPDATE employees
SET name = 'Mosha', role = 'admin'
WHERE email = 'mosha@seed.com';

-- 3. Crear categorías
INSERT INTO categories (name, description) VALUES
  ('Limpieza', 'Productos de limpieza y cuidado personal'),
  ('Cigarrillos', 'Productos de cigarrería');

-- 4. Crear productos
DO $$
DECLARE
  limpieza_id UUID;
  cigarro_id UUID;
BEGIN
  SELECT id INTO limpieza_id FROM categories WHERE name = 'Limpieza' LIMIT 1;
  SELECT id INTO cigarro_id FROM categories WHERE name = 'Cigarrillos' LIMIT 1;

  INSERT INTO products (name, barcode, price, cost, category_id, stock, min_stock) VALUES
    ('Detergente en Polvo 250g', '', 350, 275, limpieza_id, 0, 10),
    ('Detergente Líquido 500ml', '', 480, 380, limpieza_id, 0, 10),
    ('Jabón de Baño 70g', '', 220, 160, limpieza_id, 0, 20),
    ('Rueda de Cigarro Popular Azul', '', 3800, 3300, cigarro_id, 0, 5);
END $$;

-- 5. Verificar
SELECT 'Usuario:' as tipo, id, email, name, role FROM employees WHERE email = 'mosha@seed.com';
SELECT 'Categorías:' as tipo, name FROM categories;
SELECT 'Productos:' as tipo, name, cost, price FROM products;
