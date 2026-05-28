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
