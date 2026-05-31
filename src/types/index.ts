export interface Database {
  public: {
    Tables: {
      employees: {
        Row: Employee
        Insert: Omit<Employee, 'id' | 'created_at'>
        Update: Partial<Omit<Employee, 'id'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at'>
        Update: Partial<Omit<Product, 'id'>>
      }
      stock_movements: {
        Row: StockMovement
        Insert: Omit<StockMovement, 'id' | 'created_at'>
        Update: Partial<Omit<StockMovement, 'id'>>
      }
      damaged_products: {
        Row: DamagedProduct
        Insert: Omit<DamagedProduct, 'id' | 'created_at'>
        Update: Partial<Omit<DamagedProduct, 'id'>>
      }
      sales: {
        Row: Sale
        Insert: Omit<Sale, 'id' | 'created_at'>
        Update: Partial<Omit<Sale, 'id'>>
      }
      sale_items: {
        Row: SaleItem
        Insert: Omit<SaleItem, 'id'>
        Update: Partial<Omit<SaleItem, 'id'>>
      }
      caja_sessions: {
        Row: CajaSession
        Insert: Omit<CajaSession, 'id' | 'opened_at' | 'closed_at' | 'expected_cash' | 'actual_cash' | 'difference'>
        Update: Partial<Omit<CajaSession, 'id'>>
      }
      caja_movements: {
        Row: CajaMovement
        Insert: Omit<CajaMovement, 'id' | 'created_at'>
        Update: Partial<Omit<CajaMovement, 'id'>>
      }
    }
  }
}

export interface Employee {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
  created_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  barcode: string | null
  price: number
  cost: number | null
  category_id: string | null
  stock: number
  min_stock: number
  created_at: string
}

export interface StockMovement {
  id: string
  product_id: string
  quantity: number
  type: 'in' | 'out' | 'adjustment'
  notes: string | null
  employee_id: string
  created_at: string
}

export interface DamagedProduct {
  id: string
  product_id: string
  quantity: number
  reason: string
  employee_id: string
  created_at: string
}

export interface Sale {
  id: string
  total: number
  payment_method: 'cash' | 'card' | 'transfer'
  employee_id: string
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product_name: string
  quantity: number
  price: number
  subtotal: number
}

export interface CajaSession {
  id: string
  employee_open_id: string
  employee_close_id: string | null
  opened_at: string
  closed_at: string | null
  initial_cash: number
  expected_cash: number | null
  actual_cash: number | null
  difference: number | null
  status: 'open' | 'closed'
  notes: string | null
}

export interface CajaMovement {
  id: string
  session_id: string
  type: 'in' | 'out'
  concept: string
  amount: number
  employee_id: string
  created_at: string
}
