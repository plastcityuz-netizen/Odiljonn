// Cross-module logic test — validates spec §63 (SALES→STOCK→REVENUE etc.)
import { buildDemoData } from '../src/lib/demoData'
import { reducer, type Action } from '../src/lib/store'
import {
  monthlySeries, monthIncome, receivables, inventoryValue, lowStockProducts, cashFlow, productSales,
} from '../src/lib/analytics'
import { can, canAccess } from '../src/lib/permissions'
import { aiAnswer, buildInsights } from '../src/lib/ai'

let passed = 0
let failed = 0
function check(name: string, cond: boolean, extra = '') {
  if (cond) { passed++; console.log(`  ✅ ${name}`) }
  else { failed++; console.log(`  ❌ ${name} ${extra}`) }
}

console.log('\n=== 1. Demo data coherence ===')
const data = buildDemoData()
check('products exist', data.products.length >= 15)
check('orders exist', data.orders.length >= 9)
check('customers exist', data.customers.length >= 10)
check('transactions exist', data.transactions.length > 50)
check('employees exist', data.employees.length >= 12)
check('suppliers exist', data.suppliers.length >= 5)
check('purchases exist', data.purchases.length >= 6)
check('production exist', data.production.length >= 5)

console.log('\n=== 2. Monthly series coherence ===')
const series = monthlySeries(data.transactions, 12)
check('12 months', series.length === 12)
check('all completed months have income > 100M', series.slice(0, -1).every((m) => m.income > 100_000_000))
check('current month in progress has income > 0', series[series.length - 1].income > 0)
check('profit = income - expense', series.every((m) => m.profit === m.income - m.expense))
const inc = monthIncome(data.transactions)
check('current month income > 0 (orders→transactions linked)', inc > 0, `got ${inc}`)

console.log('\n=== 3. ADD_ORDER cross-module effects ===')
const product = data.products.find((p) => p.type === 'finished' && p.stock > 100)!
const customer = data.customers[0]
const stockBefore = product.stock
const invBefore = inventoryValue(data.products)
const incBefore = monthIncome(data.transactions)
const orderCount = data.orders.length
const paidTrxCount = data.transactions.filter((t) => t.type === 'income').length

let s1 = reducer(data, {
  type: 'ADD_ORDER',
  order: {
    customerId: customer.id,
    items: [{ productId: product.id, qty: 50, price: product.salePrice }],
    amount: 50 * product.salePrice,
    paidAmount: 50 * product.salePrice,
    payment: 'paid',
  },
} as Action)

check('order added', s1.orders.length === orderCount + 1)
check('stock decreased by 50', s1.products.find((p) => p.id === product.id)!.stock === stockBefore - 50)
check('income transaction created', s1.transactions.filter((t) => t.type === 'income').length === paidTrxCount + 1)
check('month income increased', monthIncome(s1.transactions) > incBefore)
check('inventory value decreased', inventoryValue(s1.products) < invBefore)
check('notification created', s1.notifications[0].title.includes('savdo'))
check('activity logged', s1.activity[0].action.includes('savdo'))

console.log('\n=== 4. Credit order → receivable → payment ===')
let s2 = reducer(data, {
  type: 'ADD_ORDER',
  order: {
    customerId: customer.id,
    items: [{ productId: product.id, qty: 10, price: product.salePrice }],
    amount: 10 * product.salePrice,
    paidAmount: 0,
    payment: 'unpaid',
  },
} as Action)
const newOrderId = s2.orders[0].id
const recBefore = receivables(s2).length
check('receivable created for unpaid order', receivables(s2).some((r) => r.order.id === newOrderId))
let s3 = reducer(s2, { type: 'ADD_PAYMENT', orderId: newOrderId, amount: 10 * product.salePrice } as Action)
check('order fully paid after payment', s3.orders.find((o) => o.id === newOrderId)!.payment === 'paid')
check('receivable cleared', receivables(s3).length === recBefore - 1)
check('cash flow increased by payment', cashFlow(s3.transactions) > cashFlow(s2.transactions))

console.log('\n=== 5. DELETE_ORDER restores stock ===')
let s4 = reducer(s1, { type: 'DELETE_ORDER', id: s1.orders[0].id } as Action)
check('stock restored', s4.products.find((p) => p.id === product.id)!.stock === stockBefore)
check('linked transaction removed', s4.transactions.filter((t) => t.ref?.id === s1.orders[0].id).length === 0)

console.log('\n=== 6. Purchase flow: received → stock up, paid → expense ===')
const rawMat = data.products.find((p) => p.type === 'raw')!
const rawStockBefore = rawMat.stock
let s5 = reducer(data, {
  type: 'ADD_PURCHASE',
  purchase: {
    supplierId: data.suppliers[0].id,
    items: [{ productId: rawMat.id, qty: 25, price: rawMat.costPrice }],
    amount: 25 * rawMat.costPrice,
    status: 'received',
    expectedDate: new Date().toISOString(),
  },
} as Action)
check('raw material stock increased by 25', s5.products.find((p) => p.id === rawMat.id)!.stock === rawStockBefore + 25)
const purchaseRefCountBefore = data.transactions.filter((t) => t.ref?.kind === 'purchase').length
check('no expense transaction for unpaid purchase', s5.transactions.filter((t) => t.ref?.kind === 'purchase').length === purchaseRefCountBefore)
const purchaseId = s5.purchases[0].id
let s6 = reducer(s5, { type: 'SET_PURCHASE_STATUS', id: purchaseId, status: 'paid' } as Action)
check('expense transaction on payment', s6.transactions.filter((t) => t.ref?.kind === 'purchase' && t.ref.id === purchaseId).length === 1)

console.log('\n=== 7. Production flow: complete → materials out, finished in, cost recorded ===')
const prodTarget = data.products.find((p) => p.id === 'prd_4')! // Plastik papka
const rawTarget = data.products.find((p) => p.id === 'prm_3')! // granula
const prodStockBefore = prodTarget.stock
const rawStockBefore2 = rawTarget.stock
let s7 = reducer(data, {
  type: 'ADD_PRODUCTION',
  production: {
    productId: prodTarget.id, qty: 500, status: 'planned',
    costs: { material: 1_000_000, labor: 500_000, energy: 200_000, logistics: 100_000, other: 50_000 },
    materials: [{ productId: rawTarget.id, qty: 5 }],
  },
} as Action)
check('production order created (planned)', s7.production[0].status === 'planned')
const prodId = s7.production[0].id
let s8 = reducer(s7, { type: 'SET_PRODUCTION_STATUS', id: prodId, status: 'completed' } as Action)
check('finished goods +500', s8.products.find((p) => p.id === prodTarget.id)!.stock === prodStockBefore + 500)
check('raw materials -5', s8.products.find((p) => p.id === rawTarget.id)!.stock === rawStockBefore2 - 5)
check('production cost expense recorded', s8.transactions.some((t) => t.ref?.kind === 'production' && t.ref.id === prodId && t.amount === 1_850_000))

console.log('\n=== 8. Payroll flow ===')
const salaryTotal = data.employees.filter((e) => e.status !== 'inactive').reduce((s, e) => s + e.salary, 0)
let s9 = reducer(data, { type: 'PAY_SALARIES' } as Action)
check('payroll expense recorded', s9.transactions[0].category === 'Ish haqi' && s9.transactions[0].amount === salaryTotal)

console.log('\n=== 9. Role-based access ===')
check('OWNER sees all', canAccess('OWNER', 'finance') && canAccess('OWNER', 'hr') && canAccess('OWNER', 'production'))
check('ACCOUNTANT sees finance+accounting', canAccess('ACCOUNTANT', 'finance') && canAccess('ACCOUNTANT', 'accounting'))
check('ACCOUNTANT cannot see production', !canAccess('ACCOUNTANT', 'production'))
check('SALES cannot see finance', !canAccess('SALES', 'finance'))
check('SALES can create orders', can('SALES', 'sales', 'create'))
check('SALES cannot delete products', !can('SALES', 'warehouse', 'delete'))
check('WAREHOUSE cannot see sales', !canAccess('WAREHOUSE', 'sales'))
check('HR cannot see finance', !canAccess('HR', 'finance'))
check('PRODUCTION cannot see sales', !canAccess('PRODUCTION', 'sales'))

console.log('\n=== 10. AI CFO engine ===')
const insights = buildInsights(data)
check('insights generated', insights.length >= 4)
check('low stock insight present', insights.some((i) => i.type === 'stock'))
const ansProfit = aiAnswer(data, 'Foydam nega kamaydi?')
check('profit answer has MUAMMO section', ansProfit.sections.some((s) => s.label === 'Muammo'))
check('profit answer has SABAB section', ansProfit.sections.some((s) => s.label === 'Sabab'))
check('profit answer has TAVSIYA section', ansProfit.sections.some((s) => s.label === 'Tavsiya'))
check('profit answer has ACTION', !!ansProfit.action)
const ansCash = aiAnswer(data, 'Cash flow qanday?')
check('cash answer distinct', ansCash.title.includes('Cash flow'))
const ansDefault = aiAnswer(data, 'salom')
check('default answer works', ansDefault.sections.length >= 3)

console.log('\n=== 11. Product sales analytics ===')
const ps = productSales(data)
check('product sales computed', ps.length > 0 && ps[0].qty > 0)

console.log(`\n═══════ RESULT: ${passed} passed, ${failed} failed ═══════\n`)
if (failed > 0) process.exit(1)
