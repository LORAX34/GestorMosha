// Seed script - uses env vars from .env
// Run: node scripts/seed.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env manually
const envPath = resolve(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar en .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Create user
const email = 'mosha@seed.com'
const password = 'Mosha1234'

const { data: userData, error: userError } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name: 'Mosha' } },
})

if (userError && !userError.message.includes('already')) {
  console.error('Error creating user:', userError.message)
  process.exit(1)
}

console.log('User created or already exists')

// If user was just created, we need to confirm the email
// This step requires manual confirmation or service_role key
console.log(`\nUsuario: ${email}`)
console.log(`Password: ${password}`)
console.log('\nIMPORTANT: Confirma el email en Supabase Auth > Users,')
console.log('o ejecuta en SQL Editor:')
console.log(`UPDATE auth.users SET email_confirmed_at = now() WHERE email = '${email}';`)
console.log('\nLuego actualiza el rol a admin:')
console.log(`UPDATE employees SET name = 'Mosha', role = 'admin' WHERE email = '${email}';`)

// Insert categories and products via REST API (bypass RLS)
// Since we can't do admin operations with anon key, print SQL instead
console.log('\n--- Para crear categorías y productos, ejecuta en SQL Editor: ---')
console.log(`
INSERT INTO categories (name, description) VALUES
  ('Limpieza', 'Productos de limpieza y cuidado personal'),
  ('Cigarrillos', 'Productos de cigarrería')
ON CONFLICT DO NOTHING;

DO \$\$
DECLARE
  limpieza_id UUID; cigarro_id UUID;
BEGIN
  SELECT id INTO limpieza_id FROM categories WHERE name = 'Limpieza' LIMIT 1;
  SELECT id INTO cigarro_id FROM categories WHERE name = 'Cigarrillos' LIMIT 1;

  INSERT INTO products (name, barcode, price, cost, category_id, stock, min_stock) VALUES
    ('Detergente en Polvo 250g', '', 350, 275, limpieza_id, 0, 10),
    ('Detergente Líquido 500ml', '', 480, 380, limpieza_id, 0, 10),
    ('Jabón de Baño 70g', '', 220, 160, limpieza_id, 0, 20),
    ('Rueda de Cigarro Popular Azul', '', 3800, 3300, cigarro_id, 0, 5)
  ON CONFLICT DO NOTHING;
END \$\$;
`)
