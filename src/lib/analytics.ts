// BALANS AI — Derived analytics: everything computed from the shared store
import { MONTHS_UZ, monthKey } from './utils'
import type { DataState, Order, Product, Transaction } from './types'

export interface MonthPoint {
  key: string
  label: string
  income: number
  expense: number
  profit: number
}

export function monthlySeries(transactions: Transaction[], months = 12): MonthPoint[] {
  const now = new Date()
  const keys: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(monthKey(d))
  }
  const map = new Map<string, MonthPoint>(keys.map((k) => {
    const m = parseInt(k.split('-')[1], 10) - 1
    return [k, { key: k, label: MONTHS_UZ[m], income: 0, expense: 0, profit: 0 }]
  }))
  for (const t of transactions) {
    const k = monthKey(t.date)
    const point = map.get(k)
    if (!point) continue
    if (t.type === 'income') point.income += t.amount
    else point.expense += t.amount
  }
  const arr = [...map.values()]
  arr.forEach((p) => { p.profit = p.income - p.expense })
  return arr
}

export const isToday = (iso: string) => monthKey(iso) === monthKey(new Date()) && new Date(iso).getDate() === new Date().getDate()
export const isThisMonth = (iso: string) => monthKey(iso) === monthKey(new Date())
export const isPrevMonth = (iso: string) => {
  const d = new Date()
  return monthKey(iso) === monthKey(new Date(d.getFullYear(), d.getMonth() - 1, 1))
}

export function sumBy<T>(arr: T[], f: (x: T) => number): number {
  return arr.reduce((s, x) => s + f(x), 0)
}

export function todaySales(orders: Order[]): number {
  return sumBy(orders.filter((o) => isToday(o.date) && o.status !== 'cancelled'), (o) => o.amount)
}

export function monthIncome(trxs: Transaction[]): number {
  return sumBy(trxs.filter((t) => t.type === 'income' && isThisMonth(t.date)), (t) => t.amount)
}
export function monthExpense(trxs: Transaction[]): number {
  return sumBy(trxs.filter((t) => t.type === 'expense' && isThisMonth(t.date)), (t) => t.amount)
}
export function prevMonthIncome(trxs: Transaction[]): number {
  return sumBy(trxs.filter((t) => t.type === 'income' && isPrevMonth(t.date)), (t) => t.amount)
}
export function prevMonthExpense(trxs: Transaction[]): number {
  return sumBy(trxs.filter((t) => t.type === 'expense' && isPrevMonth(t.date)), (t) => t.amount)
}

export function cashFlow(trxs: Transaction[]): number {
  return sumBy(trxs, (t) => (t.type === 'income' ? t.amount : -t.amount))
}

export function inventoryValue(products: Product[]): number {
  return sumBy(products, (p) => p.stock * p.costPrice)
}

export function lowStockProducts(products: Product[]): Product[] {
  return products.filter((p) => p.type === 'finished' && p.stock > 0 && p.stock <= p.minStock)
}
export function outOfStockProducts(products: Product[]): Product[] {
  return products.filter((p) => p.type === 'finished' && p.stock === 0)
}

export interface Receivable {
  order: Order
  remaining: number
  customerName: string
  dueDate: string
  daysLate: number
  overdue: boolean
}

export function receivables(state: DataState): Receivable[] {
  return state.orders
    .filter((o) => o.status !== 'cancelled' && o.paidAmount < o.amount)
    .map((o) => {
      const dueDate = new Date(o.date)
      dueDate.setDate(dueDate.getDate() + 14)
      const daysLate = Math.floor((Date.now() - dueDate.getTime()) / 86400000)
      return {
        order: o,
        remaining: o.amount - o.paidAmount,
        customerName: state.customers.find((c) => c.id === o.customerId)?.name ?? 'Mijoz',
        dueDate: dueDate.toISOString(),
        daysLate,
        overdue: daysLate > 0,
      }
    })
    .sort((a, b) => b.remaining - a.remaining)
}

export function payables(state: DataState) {
  return state.purchases
    .filter((p) => p.status !== 'paid')
    .map((p) => {
      const daysLate = Math.floor((Date.now() - new Date(p.expectedDate).getTime()) / 86400000)
      return {
        purchase: p,
        supplierName: state.suppliers.find((s) => s.id === p.supplierId)?.name ?? 'Yetkazib beruvchi',
        daysLate,
        overdue: daysLate > 0,
      }
    })
}

export function customerStats(customerId: string, state: DataState) {
  const orders = state.orders.filter((o) => o.customerId === customerId && o.status !== 'cancelled')
  const totalPurchases = sumBy(orders, (o) => o.amount)
  const debt = sumBy(orders, (o) => o.amount - o.paidAmount)
  const lastOrder = orders[0]?.date
  return { ordersCount: orders.length, totalPurchases, debt, lastOrder, orders: orders.slice(0, 12) }
}

export function productSales(state: DataState) {
  const qtyMap = new Map<string, { qty: number; revenue: number }>()
  for (const o of state.orders) {
    if (o.status === 'cancelled') continue
    for (const it of o.items) {
      const cur = qtyMap.get(it.productId) ?? { qty: 0, revenue: 0 }
      cur.qty += it.qty
      cur.revenue += it.qty * it.price
      qtyMap.set(it.productId, cur)
    }
  }
  return state.products
    .map((p) => {
      const s = qtyMap.get(p.id) ?? { qty: 0, revenue: 0 }
      const profit = s.qty * (p.salePrice - p.costPrice)
      return { product: p, qty: s.qty, revenue: s.revenue, profit, margin: p.salePrice > 0 ? (p.salePrice - p.costPrice) / p.salePrice : 0 }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

export function expenseBreakdown(trxs: Transaction[], monthOnly = true) {
  const map = new Map<string, number>()
  for (const t of trxs) {
    if (t.type !== 'expense') continue
    if (monthOnly && !isThisMonth(t.date)) continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  return [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
}

export function forecastMonthEnd(current: number, dayOfMonth: number, daysInMonth: number): number {
  if (dayOfMonth >= daysInMonth) return current
  return (current / dayOfMonth) * daysInMonth
}

export function healthScore(state: DataState): { score: number; parts: { label: string; score: number; max: number }[] } {
  const inc = monthIncome(state.transactions)
  const exp = monthExpense(state.transactions)
  const margin = inc > 0 ? (inc - exp) / inc : 0
  const cash = cashFlow(state.transactions)
  const rec = receivables(state)
  const overdue = rec.filter((r) => r.overdue)
  const low = lowStockProducts(state.products).length + outOfStockProducts(state.products).length
  const series = monthlySeries(state.transactions, 4)
  const growing = series.length >= 2 && series[series.length - 1].income >= series[series.length - 2].income * 0.75

  const profitability = Math.round(Math.min(1, Math.max(0, margin / 0.25)) * 30)
  const liquidity = Math.round(Math.min(1, Math.max(0, cash / 300_000_000)) * 25)
  const collection = Math.round(Math.max(0, 1 - overdue.length / 8) * 20)
  const inventory = Math.round(Math.max(0, 1 - low / 10) * 15)
  const growth = growing ? 10 : 5
  const score = profitability + liquidity + collection + inventory + growth
  return {
    score,
    parts: [
      { label: 'Rentabellik', score: profitability, max: 30 },
      { label: 'Likvidlik', score: liquidity, max: 25 },
      { label: 'Debitor qarzlari', score: collection, max: 20 },
      { label: 'Ombor holati', score: inventory, max: 15 },
      { label: 'O‘sish trendi', score: growth, max: 10 },
    ],
  }
}
