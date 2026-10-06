// BALANS AI — Common data model
export type Role = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'MANAGER' | 'SALES' | 'WAREHOUSE' | 'HR' | 'PRODUCTION'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  position?: string
}

export interface Company {
  id: string
  name: string
  type: string
  employeesCount: string
  activity: string
  modules: string[]
  taxId: string
  address: string
  currency: string
}

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  unit: string
  stock: number
  minStock: number
  costPrice: number
  salePrice: number
  type: 'finished' | 'raw'
}

export interface Customer {
  id: string
  name: string
  phone: string
  company: string
  type: 'individual' | 'business'
  createdAt: string
  notes: string
}

export interface OrderItem {
  productId: string
  qty: number
  price: number
}

export interface Order {
  id: string
  customerId: string
  items: OrderItem[]
  amount: number
  paidAmount: number
  payment: 'paid' | 'partial' | 'unpaid'
  status: 'completed' | 'pending' | 'cancelled'
  date: string // ISO
}

export interface Transaction {
  id: string
  date: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  ref?: { kind: 'order' | 'purchase' | 'production' | 'payment' | 'payroll' | 'manual'; id: string }
}

export interface Employee {
  id: string
  name: string
  position: string
  department: string
  phone: string
  salary: number
  status: 'active' | 'leave' | 'inactive'
  hiredAt: string
  performance: number // 0..100
}

export interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  category: string
  rating: number
}

export interface PurchaseItem {
  productId: string
  qty: number
  price: number
}

export interface Purchase {
  id: string
  supplierId: string
  items: PurchaseItem[]
  amount: number
  status: 'pending' | 'approved' | 'received' | 'paid'
  date: string
  expectedDate: string
}

export interface ProductionCosts {
  material: number
  labor: number
  energy: number
  logistics: number
  other: number
}

export interface ProductionOrder {
  id: string
  productId: string
  qty: number
  status: 'planned' | 'in_progress' | 'completed' | 'rejected'
  date: string
  costs: ProductionCosts
  materials: { productId: string; qty: number }[]
}

export interface DebtPayment {
  id: string
  debtId: string
  amount: number
  date: string
}

export interface Notif {
  id: string
  type: 'ai' | 'finance' | 'warehouse' | 'debt' | 'system'
  title: string
  message: string
  time: string
  read: boolean
}

export interface Invoice {
  id: string
  number: string
  date: string
  amount: number
  status: 'paid' | 'upcoming'
  plan: string
}

export interface PlanState {
  name: 'TRIAL' | 'PREMIUM' | 'BIZNES'
  cycle: 'monthly' | 'yearly'
  trialEndsAt: string
  nextPayment: string
  seats: number
  invoices: Invoice[]
}

export interface ActivityLog {
  id: string
  user: string
  action: string
  time: string
}

export interface AppSettings {
  lowStockAlerts: boolean
  dailyDigest: boolean
  debtReminders: boolean
  productionAlerts: boolean
  emailNotifs: boolean
  smsNotifs: boolean
  compactMode: boolean
}

export interface DataState {
  company: Company
  products: Product[]
  customers: Customer[]
  orders: Order[]
  transactions: Transaction[]
  employees: Employee[]
  suppliers: Supplier[]
  purchases: Purchase[]
  production: ProductionOrder[]
  payments: DebtPayment[]
  notifications: Notif[]
  plan: PlanState
  activity: ActivityLog[]
  settings: AppSettings
  users: (User & { active: boolean })[]
}
