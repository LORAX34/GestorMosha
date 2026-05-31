-- =====================================================
-- SEED: Crear usuario admin y categorías base
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

-- 3. Crear categorías base
INSERT INTO categories (name, description) VALUES
  ('Limpieza', 'Productos de limpieza y cuidado personal'),
  ('Cigarrillos', 'Productos de cigarrería');

-- 4. Verificar
SELECT 'Usuario:' as tipo, id, email, name, role FROM employees WHERE email = 'mosha@seed.com';
SELECT 'Categorías:' as tipo, name FROM categories;
