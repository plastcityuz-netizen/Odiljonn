// BALANS AI — Central data store with cross-module business logic
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { buildDemoData } from './demoData'
import { addDays, uid } from './utils'
import type {
  Customer, DebtPayment, Employee, Notif, Order, PlanState, Product, Purchase,
  PurchaseItem, ProductionOrder, Transaction, User,
} from './types'

const STORAGE_KEY = 'balans_ai_data_v1'

export type Action =
  | { type: 'RESET' }
  | { type: 'ADD_ORDER'; order: Omit<Order, 'id' | 'date' | 'status'> }
  | { type: 'UPDATE_ORDER'; order: Order }
  | { type: 'DELETE_ORDER'; id: string }
  | { type: 'ADD_PAYMENT'; orderId: string; amount: number }
  | { type: 'ADD_CUSTOMER'; customer: Omit<Customer, 'id' | 'createdAt'> }
  | { type: 'UPDATE_CUSTOMER'; customer: Customer }
  | { type: 'DELETE_CUSTOMER'; id: string }
  | { type: 'ADD_PRODUCT'; product: Omit<Product, 'id'> }
  | { type: 'UPDATE_PRODUCT'; product: Product }
  | { type: 'DELETE_PRODUCT'; id: string }
  | { type: 'ADJUST_STOCK'; id: string; delta: number }
  | { type: 'ADD_SUPPLIER'; supplier: Omit<import('./types').Supplier, 'id'> }
  | { type: 'UPDATE_SUPPLIER'; supplier: import('./types').Supplier }
  | { type: 'DELETE_SUPPLIER'; id: string }
  | { type: 'ADD_PURCHASE'; purchase: Omit<Purchase, 'id' | 'date'> & { date?: string } }
  | { type: 'SET_PURCHASE_STATUS'; id: string; status: Purchase['status'] }
  | { type: 'DELETE_PURCHASE'; id: string }
  | { type: 'ADD_PRODUCTION'; production: Omit<ProductionOrder, 'id' | 'date'> & { date?: string } }
  | { type: 'SET_PRODUCTION_STATUS'; id: string; status: ProductionOrder['status'] }
  | { type: 'DELETE_PRODUCTION'; id: string }
  | { type: 'ADD_TRANSACTION'; trx: Omit<Transaction, 'id'> }
  | { type: 'UPDATE_TRANSACTION'; trx: Transaction }
  | { type: 'DELETE_TRANSACTION'; id: string }
  | { type: 'ADD_EMPLOYEE'; employee: Omit<Employee, 'id' | 'hiredAt'> }
  | { type: 'UPDATE_EMPLOYEE'; employee: Employee }
  | { type: 'DELETE_EMPLOYEE'; id: string }
  | { type: 'UPDATE_COMPANY'; company: Partial<import('./types').Company> }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<import('./types').AppSettings> }
  | { type: 'UPDATE_PLAN'; plan: Partial<PlanState> }
  | { type: 'PAY_SALARIES' }
  | { type: 'ADD_PAYMENT_RECORD'; payment: Omit<DebtPayment, 'id'> }
  | { type: 'NOTIF_READ'; id: string }
  | { type: 'NOTIF_READ_ALL' }
  | { type: 'NOTIF_ADD'; notif: Omit<Notif, 'id' | 'time' | 'read'> }
  | { type: 'ACTIVITY'; action: string; user?: string }
  | { type: 'ADD_USER'; user: Omit<User & { active: boolean }, 'id'> }
  | { type: 'UPDATE_USER'; user: User & { active: boolean } }
  | { type: 'DELETE_USER'; id: string }

function notify(state: import('./types').DataState, n: Omit<Notif, 'id' | 'time' | 'read'>): Notif[] {
  return [{ ...n, id: uid('ntf'), time: new Date().toISOString(), read: false }, ...state.notifications].slice(0, 40)
}

function log(state: import('./types').DataState, action: string, user = 'Odiljon Nazarov') {
  return [{ id: uid('act'), user, action, time: new Date().toISOString() }, ...state.activity].slice(0, 60)
}

let orderSeq = 2000
function nextOrderId() {
  orderSeq++
  return `S-${new Date().getFullYear()}-${orderSeq}`
}

function applyOrderEffects(state: import('./types').DataState, order: Order, reverse = false): import('./types').DataState {
  // stock change + transaction creation handled by caller for forward; here: stock only
  const sign = reverse ? 1 : -1
  const products = state.products.map((p) => {
    const item = order.items.find((it) => it.productId === p.id)
    return item ? { ...p, stock: Math.max(0, p.stock + sign * item.qty) } : p
  })
  return { ...state, products }
}

export function reducer(state: import('./types').DataState, action: Action): import('./types').DataState {
  switch (action.type) {
    case 'RESET':
      return buildDemoData()

    // ---------- SALES ----------
    case 'ADD_ORDER': {
      const id = nextOrderId()
      const date = new Date().toISOString()
      const order: Order = { ...action.order, id, date, status: 'completed' }
      let next = applyOrderEffects(state, order)
      const trxs: Transaction[] = []
      if (order.paidAmount > 0) {
        trxs.push({
          id: uid('trx'), date, type: 'income', category: 'Savdo tushumi',
          description: `Buyurtma ${id} — to‘lov`, amount: order.paidAmount, ref: { kind: 'order', id },
        })
      }
      next = {
        ...next,
        orders: [order, ...next.orders],
        transactions: [...trxs, ...next.transactions],
        notifications: notify(next, {
          type: 'finance',
          title: 'Yangi savdo buyurtmasi',
          message: `${id} — ${Math.round(order.amount / 1_000_000 * 10) / 10} mln so‘m. ${order.payment === 'paid' ? 'To‘lov qabul qilindi.' : order.payment === 'partial' ? 'Qismli to‘lov.' : 'Qarz sifatida qayd etildi.'}`,
        }),
        activity: log(state, `Yangi savdo buyurtmasi yaratdi: ${id}`),
      }
      return next
    }
    case 'UPDATE_ORDER': {
      const old = state.orders.find((o) => o.id === action.order.id)
      if (!old) return state
      // reverse old stock, apply new
      let next = applyOrderEffects(state, old, true)
      next = applyOrderEffects({ ...next, orders: next.orders.map((o) => (o.id === old.id ? action.order : o)) }, action.order)
      return { ...next, activity: log(state, `Buyurtmani tahrirladi: ${action.order.id}`) }
    }
    case 'DELETE_ORDER': {
      const order = state.orders.find((o) => o.id === action.id)
      if (!order) return state
      const next = applyOrderEffects(state, order, true)
      return {
        ...next,
        orders: next.orders.filter((o) => o.id !== action.id),
        transactions: next.transactions.filter((t) => t.ref?.id !== action.id),
        activity: log(state, `Buyurtmani o‘chirildi: ${action.id}`),
      }
    }
    case 'ADD_PAYMENT': {
      const order = state.orders.find((o) => o.id === action.orderId)
      if (!order) return state
      const paidAmount = Math.min(order.amount, order.paidAmount + action.amount)
      const payment: DebtPayment = { id: uid('pay'), debtId: order.id, amount: action.amount, date: new Date().toISOString() }
      const trx: Transaction = {
        id: uid('trx'), date: new Date().toISOString(), type: 'income', category: 'Savdo tushumi',
        description: `Buyurtma ${order.id} — qarz to‘lovi`, amount: action.amount, ref: { kind: 'payment', id: payment.id },
      }
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === order.id ? { ...o, paidAmount, payment: paidAmount >= o.amount ? 'paid' : 'partial' } : o)),
        payments: [payment, ...state.payments],
        transactions: [trx, ...state.transactions],
        notifications: notify(state, { type: 'debt', title: 'Qarz to‘lovi qabul qilindi', message: `${order.id} bo‘yicha ${Math.round(action.amount / 1_000_000 * 10) / 10} mln so‘m to‘landi.` }),
        activity: log(state, `Qarz to‘lovini qabul qildi: ${order.id}`),
      }
    }

    // ---------- CUSTOMERS ----------
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [{ ...action.customer, id: uid('cus'), createdAt: new Date().toISOString() }, ...state.customers],
        activity: log(state, `Yangi mijoz qo‘shdi: ${action.customer.name}`),
      }
    case 'UPDATE_CUSTOMER':
      return { ...state, customers: state.customers.map((c) => (c.id === action.customer.id ? action.customer : c)), activity: log(state, `Mijoz ma’lumotini yangiladi: ${action.customer.name}`) }
    case 'DELETE_CUSTOMER':
      return { ...state, customers: state.customers.filter((c) => c.id !== action.id), activity: log(state, `Mijozni o‘chirdi: ${action.id}`) }

    // ---------- PRODUCTS / WAREHOUSE ----------
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [{ ...action.product, id: uid('prd') }, ...state.products],
        notifications: notify(state, { type: 'warehouse', title: 'Yangi mahsulot qo‘shildi', message: `${action.product.name} omborga kiritildi.` }),
        activity: log(state, `Yangi mahsulot qo‘shdi: ${action.product.name}`),
      }
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map((p) => (p.id === action.product.id ? action.product : p)), activity: log(state, `Mahsulotni yangiladi: ${action.product.name}`) }
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter((p) => p.id !== action.id), activity: log(state, `Mahsulotni o‘chirdi: ${action.id}`) }
    case 'ADJUST_STOCK':
      return { ...state, products: state.products.map((p) => (p.id === action.id ? { ...p, stock: Math.max(0, p.stock + action.delta) } : p)) }

    // ---------- SUPPLIERS ----------
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [{ ...action.supplier, id: uid('sup') }, ...state.suppliers], activity: log(state, `Yangi yetkazib beruvchi qo‘shdi: ${action.supplier.name}`) }
    case 'UPDATE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.map((s) => (s.id === action.supplier.id ? action.supplier : s)) }
    case 'DELETE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.filter((s) => s.id !== action.id) }

    // ---------- PURCHASES ----------
    case 'ADD_PURCHASE': {
      const id = `PO-${new Date().getFullYear()}-${String(1048 + state.purchases.length).padStart(3, '0')}`
      const purchase: Purchase = { ...action.purchase, id, date: action.purchase.date ?? new Date().toISOString() }
      let products = state.products
      if (purchase.status === 'received' || purchase.status === 'paid') {
        products = state.products.map((p) => {
          const item = purchase.items.find((it) => it.productId === p.id)
          return item ? { ...p, stock: p.stock + item.qty } : p
        })
      }
      const trxs = purchase.status === 'paid'
        ? [{ id: uid('trx'), date: purchase.date, type: 'expense' as const, category: 'Xomashyo xaridi', description: `Xarid ${id} to‘lovi`, amount: purchase.amount, ref: { kind: 'purchase' as const, id } }]
        : []
      return {
        ...state,
        purchases: [purchase, ...state.purchases],
        products,
        transactions: [...trxs, ...state.transactions],
        notifications: notify(state, { type: 'system', title: 'Yangi xarid yaratildi', message: `${id} — ${purchase.status === 'pending' ? 'tasdiqlashni kutmoqda' : purchase.status === 'approved' ? 'tasdiqlandi' : purchase.status === 'received' ? 'ombor qabul qildi' : 'to‘landi'}.` }),
        activity: log(state, `Yangi xarid yaratdi: ${id}`),
      }
    }
    case 'SET_PURCHASE_STATUS': {
      const p = state.purchases.find((x) => x.id === action.id)
      if (!p || p.status === action.status) return state
      let products = state.products
      const trxs: Transaction[] = []
      // stock effect on transition into received/paid
      if ((action.status === 'received' || action.status === 'paid') && !(p.status === 'received' || p.status === 'paid')) {
        products = state.products.map((pr) => {
          const item = p.items.find((it) => it.productId === pr.id)
          return item ? { ...pr, stock: pr.stock + item.qty } : pr
        })
      }
      if (action.status === 'paid' && p.status !== 'paid') {
        trxs.push({ id: uid('trx'), date: new Date().toISOString(), type: 'expense', category: 'Xomashyo xaridi', description: `Xarid ${p.id} to‘lovi`, amount: p.amount, ref: { kind: 'purchase', id: p.id } })
      }
      return {
        ...state,
        purchases: state.purchases.map((x) => (x.id === action.id ? { ...x, status: action.status } : x)),
        products,
        transactions: [...trxs, ...state.transactions],
        notifications: notify(state, { type: 'system', title: 'Xarid holati yangilandi', message: `${p.id}: ${p.status} → ${action.status}` }),
        activity: log(state, `Xarid holatini o‘zgartirdi: ${p.id} → ${action.status}`),
      }
    }
    case 'DELETE_PURCHASE': {
      const p = state.purchases.find((x) => x.id === action.id)
      if (!p) return state
      let products = state.products
      if (p.status === 'received' || p.status === 'paid') {
        products = state.products.map((pr) => {
          const item = p.items.find((it) => it.productId === pr.id)
          return item ? { ...pr, stock: Math.max(0, pr.stock - item.qty) } : pr
        })
      }
      return {
        ...state,
        purchases: state.purchases.filter((x) => x.id !== action.id),
        products,
        transactions: state.transactions.filter((t) => t.ref?.id !== action.id),
      }
    }

    // ---------- PRODUCTION ----------
    case 'ADD_PRODUCTION': {
      const id = `PR-${120 + state.production.length + 1}`
      const po: ProductionOrder = { ...action.production, id, date: action.production.date ?? new Date().toISOString() }
      return {
        ...state,
        production: [po, ...state.production],
        activity: log(state, `Ishlab chiqarish buyrug‘i yaratdi: ${id}`),
      }
    }
    case 'SET_PRODUCTION_STATUS': {
      const po = state.production.find((x) => x.id === action.id)
      if (!po || po.status === action.status) return state
      let products = state.products
      const trxs: Transaction[] = []
      if (action.status === 'completed' && po.status !== 'completed') {
        // consume raw materials + add finished goods + record cost
        products = state.products.map((p) => {
          const mat = po.materials.find((m) => m.productId === p.id)
          if (mat) return { ...p, stock: Math.max(0, p.stock - mat.qty) }
          if (p.id === po.productId) return { ...p, stock: p.stock + po.qty }
          return p
        })
        const total = Object.values(po.costs).reduce((a, b) => a + b, 0)
        trxs.push({ id: uid('trx'), date: new Date().toISOString(), type: 'expense', category: 'Ishlab chiqarish xarajati', description: `Ishlab chiqarish buyrug‘i ${po.id} — tannarx`, amount: total, ref: { kind: 'production', id: po.id } })
      }
      if (action.status !== 'completed' && po.status === 'completed') {
        // reverse
        products = state.products.map((p) => {
          const mat = po.materials.find((m) => m.productId === p.id)
          if (mat) return { ...p, stock: p.stock + mat.qty }
          if (p.id === po.productId) return { ...p, stock: Math.max(0, p.stock - po.qty) }
          return p
        })
      }
      return {
        ...state,
        production: state.production.map((x) => (x.id === action.id ? { ...x, status: action.status } : x)),
        products,
        transactions: action.status === 'completed' ? [...trxs, ...state.transactions] : state.transactions.filter((t) => t.ref?.id !== action.id || t.ref.kind !== 'production'),
        notifications: notify(state, { type: 'system', title: 'Ishlab chiqarish yangilandi', message: `${po.id} holati: ${action.status === 'completed' ? 'bajarildi — tayyor mahsulot omborga kirdi' : action.status}.` }),
        activity: log(state, `Ishlab chiqarish holatini yangiladi: ${po.id} → ${action.status}`),
      }
    }
    case 'DELETE_PRODUCTION':
      return { ...state, production: state.production.filter((p) => p.id !== action.id), transactions: state.transactions.filter((t) => t.ref?.id !== action.id) }

    // ---------- ACCOUNTING ----------
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [{ ...action.trx, id: uid('trx') }, ...state.transactions],
        activity: log(state, `${action.trx.type === 'income' ? 'Daromad' : 'Xarajat'} qo‘shdi: ${action.trx.description}`),
      }
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map((t) => (t.id === action.trx.id ? action.trx : t)) }
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id), activity: log(state, `Tranzaksiyani o‘chirdi: ${action.id}`) }

    // ---------- HR ----------
    case 'ADD_EMPLOYEE':
      return {
        ...state,
        employees: [{ ...action.employee, id: uid('emp'), hiredAt: new Date().toISOString() }, ...state.employees],
        notifications: notify(state, { type: 'system', title: 'Yangi xodim', message: `${action.employee.name} — ${action.employee.position} sifatida qo‘shildi.` }),
        activity: log(state, `Yangi xodim qo‘shdi: ${action.employee.name}`),
      }
    case 'UPDATE_EMPLOYEE':
      return { ...state, employees: state.employees.map((e) => (e.id === action.employee.id ? action.employee : e)) }
    case 'DELETE_EMPLOYEE':
      return { ...state, employees: state.employees.filter((e) => e.id !== action.id), activity: log(state, `Xodimni o‘chirdi: ${action.id}`) }
    case 'PAY_SALARIES': {
      const total = state.employees.filter((e) => e.status !== 'inactive').reduce((s, e) => s + e.salary, 0)
      const trx: Transaction = {
        id: uid('trx'), date: new Date().toISOString(), type: 'expense', category: 'Ish haqi',
        description: 'Oylik ish haqi to‘lovi', amount: total, ref: { kind: 'payroll', id: uid('payroll') },
      }
      return {
        ...state,
        transactions: [trx, ...state.transactions],
        notifications: notify(state, { type: 'finance', title: 'Ish haqi to‘landi', message: `${state.employees.filter((e) => e.status !== 'inactive').length} xodimga jami ${Math.round(total / 1_000_000)} mln so‘m to‘landi.` }),
        activity: log(state, `Ish haqini to‘ladi: ${Math.round(total / 1_000_000)} mln so‘m`),
      }
    }

    // ---------- MISC ----------
    case 'UPDATE_COMPANY':
      return { ...state, company: { ...state.company, ...action.company }, activity: log(state, 'Kompaniya ma’lumotlarini yangiladi') }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'UPDATE_PLAN':
      return { ...state, plan: { ...state.plan, ...action.plan } }
    case 'ADD_PAYMENT_RECORD':
      return { ...state, payments: [{ ...action.payment, id: uid('pay') }, ...state.payments] }
    case 'NOTIF_READ':
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)) }
    case 'NOTIF_READ_ALL':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }
    case 'NOTIF_ADD':
      return { ...state, notifications: notify(state, action.notif) }
    case 'ACTIVITY':
      return { ...state, activity: log(state, action.action, action.user) }
    case 'ADD_USER':
      return { ...state, users: [{ ...action.user, id: uid('usr') }, ...state.users], activity: log(state, `Yangi foydalanuvchi qo‘shdi: ${action.user.name}`) }
    case 'UPDATE_USER':
      return { ...state, users: state.users.map((u) => (u.id === action.user.id ? action.user : u)) }
    case 'DELETE_USER':
      return { ...state, users: state.users.filter((u) => u.id !== action.id) }
    default:
      return state
  }
}

function loadInitial(): import('./types').DataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.orders && parsed.products) return parsed
    }
  } catch { /* ignore */ }
  return buildDemoData()
}

interface DataContextValue {
  data: import('./types').DataState
  dispatch: React.Dispatch<Action>
  resetDemo: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined as unknown as import('./types').DataState, loadInitial)

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* quota */ }
    }, 250)
    return () => clearTimeout(t)
  }, [data])

  const value = useMemo(() => ({
    data,
    dispatch,
    resetDemo: () => {
      localStorage.removeItem(STORAGE_KEY)
      dispatch({ type: 'RESET' })
    },
  }), [data])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

// helpers used across pages
export function orderItemsLabel(items: PurchaseItem[] | Order['items'], products: Product[]): string {
  if (!items.length) return '—'
  const first = products.find((p) => p.id === items[0].productId)
  const rest = items.length - 1
  return `${first?.name ?? 'Mahsulot'}${rest > 0 ? ` +${rest}` : ''}`
}
