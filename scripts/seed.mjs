import pg from 'pg'

const { Client } = pg

const client = new Client({
  host: 'db.snpxqmwlvyfafpwngzmv.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Lokiloved04*',
  ssl: { rejectUnauthorized: false },
})

await client.connect()

console.log('Connected to database')

// Create auth user
const res = await client.query(`
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
  )
  ON CONFLICT (email) DO UPDATE SET email_confirmed_at = now()
  RETURNING id
`)

const userId = res.rows[0].id
console.log('User created:', userId)

// Update employee
await client.query(`
  UPDATE employees SET name = 'Mosha', role = 'admin' WHERE id = $1
`, [userId])
console.log('Employee updated to admin')

// Create categories
const cats = await client.query(`
  INSERT INTO categories (name, description) VALUES
    ('Limpieza', 'Productos de limpieza y cuidado personal'),
    ('Cigarrillos', 'Productos de cigarrería')
  ON CONFLICT DO NOTHING
  RETURNING id, name
`)
console.log('Categories:', cats.rows.map(c => c.name).join(', '))

const catMap = {}
for (const c of cats.rows) {
  catMap[c.name] = c.id
}

// If categories already existed, fetch them
if (cats.rows.length < 2) {
  const existing = await client.query(`SELECT id, name FROM categories WHERE name IN ('Limpieza', 'Cigarrillos')`)
  for (const c of existing.rows) {
    catMap[c.name] = c.id
  }
}

// Create products
await client.query(`
  INSERT INTO products (name, barcode, price, cost, category_id, stock, min_stock) VALUES
    ($1, '', 350, 275, $2, 0, 10),
    ($3, '', 480, 380, $2, 0, 10),
    ($4, '', 220, 160, $2, 0, 20),
    ($5, '', 3800, 3300, $6, 0, 5)
  ON CONFLICT DO NOTHING
`, [
  'Detergente en Polvo 250g', catMap['Limpieza'],
  'Detergente Líquido 500ml',
  'Jabón de Baño 70g',
  'Rueda de Cigarro Popular Azul', catMap['Cigarrillos'],
])

console.log('Products created successfully')

await client.end()
console.log('Done!')
