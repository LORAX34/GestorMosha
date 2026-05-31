// Script para limpiar datos (productos, ventas, etc.)
// Usa el usuario admin para autenticarse (RLS permite delete)
// Ejecutar: node scripts/cleanup.mjs
// Luego ejecutar cleanup.sql en Supabase SQL Editor

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
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

async function main() {
  // Login as admin
  const { data: auth, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'mosha@seed.com',
    password: 'Mosha1234',
  })
  if (loginError) { console.error('Login error:', loginError.message); process.exit(1) }
  console.log('✓ Autenticado como:', auth.user?.email)

  // Delete in order (respect FK)
  console.log('Eliminando datos...')

  const { error: e1 } = await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e1) console.error('Error sale_items:', e1.message)
  else console.log('  ✓ sale_items')

  const { error: e2 } = await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e2) console.error('Error sales:', e2.message)
  else console.log('  ✓ sales')

  const { error: e3 } = await supabase.from('damaged_products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e3) console.error('Error damaged_products:', e3.message)
  else console.log('  ✓ damaged_products')

  const { error: e4 } = await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e4) console.error('Error stock_movements:', e4.message)
  else console.log('  ✓ stock_movements')

  const { error: e5 } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e5) console.error('Error products:', e5.message)
  else console.log('  ✓ products')

  console.log('\n✓ Limpieza completada.')
  console.log('\n--- IMPORTANTE: Ejecutar cleanup.sql en Supabase SQL Editor ---')
  console.log('Abre https://supabase.com/dashboard/project/snpxqmwlvyfafpwngzmv/sql/new')
  console.log('y pega el contenido de scripts/cleanup.sql')
}

main().catch(console.error)
