// BALANS AI — Seed demo data (deterministic, coherent, cross-module consistent)
import { addDays, mulberry32, uid } from './utils'
import type {
  ActivityLog, Company, Customer, Employee, Notif, Order, PlanState, Product,
  Purchase, ProductionOrder, Supplier, Transaction, User,
} from './types'

const now = new Date()
const nowISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30).toISOString()
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
const dayOfMonth = now.getDate()

const products: Product[] = [
  { id: 'prd_1', name: 'Ofis qog‘ozi A4, 500 varaq', sku: 'OS-QOG-A4', category: 'Qog‘oz mahsulotlari', unit: 'paket', stock: 1240, minStock: 300, costPrice: 28000, salePrice: 38000, type: 'finished' },
  { id: 'prd_2', name: 'Printer kartirigi HP 125A', sku: 'OS-KRT-125', category: 'Ofis texnikasi', unit: 'dona', stock: 64, minStock: 40, costPrice: 320000, salePrice: 445000, type: 'finished' },
  { id: 'prd_3', name: 'Ro‘yxat daftari, 96 varaq', sku: 'OS-DAF-96', category: 'Qog‘oz mahsulotlari', unit: 'dona', stock: 2100, minStock: 500, costPrice: 12000, salePrice: 19000, type: 'finished' },
  { id: 'prd_4', name: 'Plastik papka A4', sku: 'OS-PAK-A4', category: 'Ofis jihozlari', unit: 'dona', stock: 3850, minStock: 800, costPrice: 8000, salePrice: 14000, type: 'finished' },
  { id: 'prd_5', name: 'Marker Pilot, qora', sku: 'OS-MRK-PK', category: 'Yozuv asboblari', unit: 'dona', stock: 420, minStock: 200, costPrice: 9000, salePrice: 15000, type: 'finished' },
  { id: 'prd_6', name: 'Qalam to‘plami 12 dona', sku: 'OS-KLM-12', category: 'Yozuv asboblari', unit: 'to‘plam', stock: 180, minStock: 250, costPrice: 22000, salePrice: 34000, type: 'finished' },
  { id: 'prd_7', name: 'Stepler, katta', sku: 'OS-STP-L', category: 'Ofis jihozlari', unit: 'dona', stock: 310, minStock: 100, costPrice: 35000, salePrice: 52000, type: 'finished' },
  { id: 'prd_8', name: 'Yopishtiruvchi lenta, 6 dona', sku: 'OS-LNT-6', category: 'Ofis jihozlari', unit: 'to‘plam', stock: 95, minStock: 150, costPrice: 15000, salePrice: 24000, type: 'finished' },
  { id: 'prd_9', name: 'Doska tozalagich', sku: 'OS-DST-K', category: 'Ofis jihozlari', unit: 'dona', stock: 26, minStock: 50, costPrice: 18000, salePrice: 29000, type: 'finished' },
  { id: 'prd_10', name: 'Ofis qog‘ozi A3, 500 varaq', sku: 'OS-QOG-A3', category: 'Qog‘oz mahsulotlari', unit: 'paket', stock: 0, minStock: 100, costPrice: 44000, salePrice: 61000, type: 'finished' },
  { id: 'prd_11', name: 'Katalog qoplamasi, glossy', sku: 'OS-QPM-GL', category: 'Qog‘oz mahsulotlari', unit: 'dona', stock: 560, minStock: 200, costPrice: 6500, salePrice: 11500, type: 'finished' },
  { id: 'prm_1', name: 'Sellyuloza bo‘lagi, 1 t', sku: 'RM-SEL-1T', category: 'Xomashyo', unit: 'tonna', stock: 12, minStock: 5, costPrice: 4200000, salePrice: 0, type: 'raw' },
  { id: 'prm_2', name: 'Karton rulon, 1 t', sku: 'RM-KRT-1T', category: 'Xomashyo', unit: 'tonna', stock: 8, minStock: 4, costPrice: 3800000, salePrice: 0, type: 'raw' },
  { id: 'prm_3', name: 'Plastik granula, 25 kg', sku: 'RM-GRN-25', category: 'Xomashyo', unit: 'qop', stock: 44, minStock: 20, costPrice: 640000, salePrice: 0, type: 'raw' },
  { id: 'prm_4', name: 'Sintetik bo‘yoq, 10 L', sku: 'RM-BOY-10', category: 'Xomashyo', unit: 'chelak', stock: 15, minStock: 6, costPrice: 980000, salePrice: 0, type: 'raw' },
  { id: 'prm_5', name: 'O‘ram lentasi, 100 m', sku: 'RM-LNT-100', category: 'O‘rov materiallari', unit: 'rulon', stock: 60, minStock: 30, costPrice: 120000, salePrice: 0, type: 'raw' },
]

const customers: Customer[] = [
  { id: 'cus_1', name: 'Global Office MChJ', phone: '+998 90 123-45-67', company: 'Global Office', type: 'business', createdAt: addDays(nowISO, -420), notes: 'Yirik korporativ mijoz. Oylik 40 mln+ xarid.' },
  { id: 'cus_2', name: 'Bekzod Karimov', phone: '+998 93 555-21-08', company: '—', type: 'individual', createdAt: addDays(nowISO, -310), notes: 'Doimiy chakana mijoz.' },
  { id: 'cus_3', name: 'Toshkent IT Maktablari', phone: '+998 71 200-10-10', company: 'IT Park Maktablar', type: 'business', createdAt: addDays(nowISO, -560), notes: 'Davlat sektori. To‘lovlar shartnomaga muvofiq.' },
  { id: 'cus_4', name: 'Nodira Azimova', phone: '+998 90 777-40-33', company: 'Nodira Beauty', type: 'individual', createdAt: addDays(nowISO, -180), notes: '' },
  { id: 'cus_5', name: 'Sarvat Savdo LLC', phone: '+998 97 445-66-88', company: 'Sarvat Savdo', type: 'business', createdAt: addDays(nowISO, -240), notes: 'Ulgurji xaridor.' },
  { id: 'cus_6', name: 'Jasur Toshpulatov', phone: '+998 99 310-77-55', company: '—', type: 'individual', createdAt: addDays(nowISO, -95), notes: '' },
  { id: 'cus_7', name: 'Zamin Group', phone: '+998 78 150-60-40', company: 'Zamin Group', type: 'business', createdAt: addDays(nowISO, -400), notes: 'Qurilish kompaniyasi, ofis jihozlari xaridi.' },
  { id: 'cus_8', name: 'Dilshod Rahimov', phone: '+998 94 200-35-19', company: '—', type: 'individual', createdAt: addDays(nowISO, -60), notes: '' },
  { id: 'cus_9', name: 'Osiyo Books tarmog‘i', phone: '+998 90 909-12-12', company: 'Osiyo Books', type: 'business', createdAt: addDays(nowISO, -520), notes: 'Kitob do‘konlari tarmog‘i.' },
  { id: 'cus_10', name: 'Madina Yusupova', phone: '+998 88 511-73-26', company: '—', type: 'individual', createdAt: addDays(nowISO, -140), notes: '' },
  { id: 'cus_11', name: 'Ulug‘bek Nazarov', phone: '+998 91 333-90-14', company: '—', type: 'individual', createdAt: addDays(nowISO, -30), notes: 'Yangi mijoz.' },
  { id: 'cus_12', name: 'Anhor Market', phone: '+998 71 288-44-70', company: 'Anhor Market', type: 'business', createdAt: addDays(nowISO, -350), notes: '' },
]

const employees: Employee[] = [
  { id: 'emp_1', name: 'Odiljon Nazarov', position: 'Bosh direktor', department: 'Boshqaruv', phone: '+998 90 111-22-33', salary: 18000000, status: 'active', hiredAt: addDays(nowISO, -1460), performance: 94 },
  { id: 'emp_2', name: 'Malika Tosheva', position: 'Bosh buxgalter', department: 'Moliya', phone: '+998 90 234-56-78', salary: 12000000, status: 'active', hiredAt: addDays(nowISO, -1120), performance: 91 },
  { id: 'emp_3', name: 'Sardor Aliyev', position: 'Buxgalter', department: 'Moliya', phone: '+998 93 345-67-89', salary: 8500000, status: 'active', hiredAt: addDays(nowISO, -730), performance: 82 },
  { id: 'emp_4', name: 'Kamola Ergasheva', position: 'Savdo bo‘limi boshlig‘i', department: 'Savdo', phone: '+998 90 456-78-90', salary: 10500000, status: 'active', hiredAt: addDays(nowISO, -900), performance: 88 },
  { id: 'emp_5', name: 'Jasur Xolmatov', position: 'Sotuv menejeri', department: 'Savdo', phone: '+998 97 567-89-01', salary: 7500000, status: 'active', hiredAt: addDays(nowISO, -540), performance: 79 },
  { id: 'emp_6', name: 'Gulinur Saidova', position: 'Ombor mudiri', department: 'Ombor', phone: '+998 94 678-90-12', salary: 8000000, status: 'active', hiredAt: addDays(nowISO, -820), performance: 85 },
  { id: 'emp_7', name: 'Rustam Qodirov', position: 'HR mutaxassisi', department: 'HR', phone: '+998 90 789-01-23', salary: 7000000, status: 'leave', hiredAt: addDays(nowISO, -460), performance: 77 },
  { id: 'emp_8', name: 'Sherzod Yo‘ldoshev', phone: '+998 91 890-12-34', position: 'Ishlab chiqarish ustasi', department: 'Ishlab chiqarish', salary: 9500000, status: 'active', hiredAt: addDays(nowISO, -650), performance: 86 },
  { id: 'emp_9', name: 'Aziza Karimova', position: 'Sotuv menejeri', department: 'Savdo', phone: '+998 88 901-23-45', salary: 7000000, status: 'active', hiredAt: addDays(nowISO, -300), performance: 73 },
  { id: 'emp_10', name: 'Farrux Toshmatov', position: 'Haydovchi', department: 'Logistika', phone: '+998 93 012-34-56', salary: 5500000, status: 'active', hiredAt: addDays(nowISO, -980), performance: 68 },
  { id: 'emp_11', name: 'Zilola Ergasheva', position: 'Marketing mutaxassisi', department: 'Marketing', phone: '+998 90 123-09-87', salary: 8000000, status: 'active', hiredAt: addDays(nowISO, -210), performance: 81 },
  { id: 'emp_12', name: 'Otabek Sultonov', position: 'Omborchi', department: 'Ombor', phone: '+998 99 234-08-76', salary: 5000000, status: 'active', hiredAt: addDays(nowISO, -150), performance: 64 },
  { id: 'emp_13', name: 'Dilnoza Rahmonova', position: 'Ofis menejeri', department: 'Boshqaruv', phone: '+998 90 345-07-65', salary: 6500000, status: 'active', hiredAt: addDays(nowISO, -640), performance: 83 },
  { id: 'emp_14', name: 'Sanjar Ibrohimov', position: 'Ishlab chiqarish operatori', department: 'Ishlab chiqarish', phone: '+998 94 456-06-54', salary: 6000000, status: 'inactive', hiredAt: addDays(nowISO, -400), performance: 58 },
]

const suppliers: Supplier[] = [
  { id: 'sup_1', name: 'Toshkent Qog‘oz Savdo', contact: 'Alisher Yo‘ldoshev', phone: '+998 71 297-40-11', category: 'Qog‘oz xomashyosi', rating: 4.8 },
  { id: 'sup_2', name: 'Granula Plast LLC', contact: 'Nodir Islomov', phone: '+998 90 320-55-80', category: 'Plastik xomashyo', rating: 4.5 },
  { id: 'sup_3', name: 'Bek-Pack', contact: 'Bekzod Akmalov', phone: '+998 93 550-12-40', category: 'O‘rov materiallari', rating: 4.2 },
  { id: 'sup_4', name: 'UzKimyo Savdo', contact: 'Shahzod Umrov', phone: '+998 97 700-31-22', category: 'Bo‘yoq va kimyo', rating: 4.6 },
  { id: 'sup_5', name: 'Delta Office Supply', contact: 'Igor Pavlov', phone: '+998 90 774-90-03', category: 'Ofis jihozlari', rating: 4.9 },
  { id: 'sup_6', name: 'Anhor Logistics', contact: 'Temur Alimov', phone: '+998 88 140-60-70', category: 'Logistika', rating: 4.1 },
]

// Monthly aggregate series (income mln, expense mln), oldest → 1 month ago
const MONTHLY_SERIES: [number, number][] = [
  [295, 236], [312, 248], [338, 261], [322, 272], [355, 278], [371, 282],
  [362, 291], [388, 296], [402, 301], [396, 314], [418, 321],
]

function buildOrders(): { orders: Order[]; transactions: Transaction[] } {
  const rng = mulberry32(4242)
  const orders: Order[] = []
  const transactions: Transaction[] = []
  const businessItems: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // indexes into products (finished)
  let seq = 1000

  const makeOrder = (dayOffset: number) => {
    const date = new Date(now.getFullYear(), now.getMonth(), Math.max(1, dayOffset), 9 + Math.floor(rng() * 8), 15)
    const itemCount = rng() < 0.55 ? 1 : rng() < 0.8 ? 2 : 3
    const chosen: Order['items'] = []
    for (let i = 0; i < itemCount; i++) {
      const pIdx = businessItems[Math.floor(rng() * businessItems.length)]
      if (chosen.some((c) => c.productId === products[pIdx].id)) continue
      const big = rng() < 0.22
      const qty = big ? 40 + Math.floor(rng() * 260) : 3 + Math.floor(rng() * 45)
      chosen.push({ productId: products[pIdx].id, qty, price: products[pIdx].salePrice })
    }
    const amount = chosen.reduce((s, it) => s + it.qty * it.price, 0)
    const roll = rng()
    const payment = roll < 0.72 ? 'paid' : roll < 0.86 ? 'partial' : 'unpaid'
    const paidAmount = payment === 'paid' ? amount : payment === 'partial' ? Math.round(amount * (0.3 + rng() * 0.35)) : 0
    seq++
    const id = `S-${now.getFullYear()}-${seq}`
    orders.push({
      id, customerId: customers[Math.floor(rng() * customers.length)].id,
      items: chosen, amount, paidAmount, payment,
      status: 'completed', date: date.toISOString(),
    })
    if (paidAmount > 0) {
      transactions.push({
        id: uid('trx'), date: date.toISOString(), type: 'income', category: 'Savdo tushumi',
        description: `Buyurtma ${id} — to‘lov`, amount: paidAmount, ref: { kind: 'order', id },
      })
    }
  }

  // spread across current month up to today (min 8 orders, incl. 2-3 today)
  const totalOrders = Math.max(9, Math.min(26, Math.round(dayOfMonth * 0.85) + 4))
  const days = Array.from({ length: dayOfMonth }, (_, i) => i + 1)
  for (let i = 0; i < totalOrders; i++) {
    makeOrder(days[Math.floor(rng() * days.length)])
  }
  // guarantee today has orders
  makeOrder(dayOfMonth)
  if (dayOfMonth >= 2) makeOrder(dayOfMonth - (rng() < 0.5 ? 0 : 1))

  orders.sort((a, b) => +new Date(b.date) - +new Date(a.date))
  return { orders, transactions }
}

function buildHistoryTransactions(): Transaction[] {
  const trxs: Transaction[] = []
  const rng = mulberry32(777)
  MONTHLY_SERIES.forEach(([inc, exp], i) => {
    const monthsAgo = MONTHLY_SERIES.length - i
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 28)
    trxs.push({
      id: uid('trx'), date: d.toISOString(), type: 'income', category: 'Savdo tushumi',
      description: `Savdo tushumi (oylik jami)`, amount: inc * 1_000_000,
    })
    if (rng() < 0.5) {
      trxs.push({
        id: uid('trx'), date: new Date(d.getFullYear(), d.getMonth(), 18).toISOString(), type: 'income',
        category: 'Boshqa daromad', description: 'Konsalting va logistika xizmatlari', amount: (4 + rng() * 7) * 1_000_000,
      })
    }
    const parts: [string, number][] = [
      ['Xomashyo xaridi', exp * 0.36],
      ['Ish haqi', exp * 0.27],
      ['Ijara', 18],
      ['Logistika', exp * 0.055],
      ['Marketing', exp * 0.038],
      ['Kommunal xarajatlar', 3.6],
      ['Soliqlar va to‘lovlar', exp * 0.075],
    ]
    parts.forEach(([cat, v], j) => {
      trxs.push({
        id: uid('trx'), date: new Date(d.getFullYear(), d.getMonth(), 2 + j * 4).toISOString(),
        type: 'expense', category: cat, description: `${cat} — oylik`, amount: Math.round(v * 1_000_000),
      })
    })
  })
  return trxs
}

function buildCurrentMonthExpenses(): Transaction[] {
  const d = (day: number, hour = 12) => new Date(now.getFullYear(), now.getMonth(), Math.min(day, dayOfMonth), hour).toISOString()
  const list: [number, string, string, number][] = [
    [1, 'Ijara', 'Ombor va ofis ijarasi — oylik', 18_000_000],
    [2, 'Kommunal xarajatlar', 'Elektr va suv to‘lovlari', 3_800_000],
    [3, 'Marketing', 'Instagram va Google reklama', 9_500_000],
    [4, 'Logistika', 'Yetkazib berish xizmatlari', 7_200_000],
    [5, 'Ish haqi', 'Ish haqi avans to‘lovi', 46_000_000],
  ]
  return list.filter(([day]) => day <= dayOfMonth).map(([day, category, description, amount]) => ({
    id: uid('trx'), date: d(day), type: 'expense' as const, category, description, amount,
  }))
}

function buildPurchases(): { purchases: Purchase[]; trxs: Transaction[] } {
  const d = (day: number) => new Date(now.getFullYear(), now.getMonth(), Math.min(day, dayOfMonth), 14).toISOString()
  const purchases: Purchase[] = [
    {
      id: 'PO-2026-041', supplierId: 'sup_1', items: [{ productId: 'prm_1', qty: 6, price: 4200000 }], amount: 25200000,
      status: 'paid', date: d(2), expectedDate: d(2),
    },
    {
      id: 'PO-2026-042', supplierId: 'sup_5', items: [{ productId: 'prd_6', qty: 400, price: 22000 }, { productId: 'prd_8', qty: 250, price: 15000 }],
      amount: 12_700_000, status: 'paid', date: d(4), expectedDate: d(4),
    },
    {
      id: 'PO-2026-043', supplierId: 'sup_2', items: [{ productId: 'prm_3', qty: 30, price: 640000 }], amount: 19_200_000,
      status: 'received', date: d(3), expectedDate: d(3),
    },
    {
      id: 'PO-2026-044', supplierId: 'sup_4', items: [{ productId: 'prm_4', qty: 10, price: 980000 }], amount: 9_800_000,
      status: 'received', date: addDays(nowISO, -12), expectedDate: addDays(nowISO, -12),
    },
    {
      id: 'PO-2026-045', supplierId: 'sup_3', items: [{ productId: 'prm_5', qty: 80, price: 120000 }], amount: 9_600_000,
      status: 'approved', date: d(5), expectedDate: addDays(nowISO, 4),
    },
    {
      id: 'PO-2026-046', supplierId: 'sup_1', items: [{ productId: 'prm_2', qty: 5, price: 3800000 }], amount: 19_000_000,
      status: 'pending', date: d(6), expectedDate: addDays(nowISO, 8),
    },
    {
      id: 'PO-2026-047', supplierId: 'sup_6', items: [], amount: 6_400_000, status: 'pending', date: d(6), expectedDate: addDays(nowISO, 3),
    },
  ]
  const trxs: Transaction[] = purchases
    .filter((p) => p.status === 'paid')
    .map((p) => ({
      id: uid('trx'), date: p.date, type: 'expense' as const, category: 'Xomashyo xaridi',
      description: `Xarid ${p.id} to‘lovi`, amount: p.amount, ref: { kind: 'purchase' as const, id: p.id },
    }))
  return { purchases, trxs }
}

function buildProduction(): { production: ProductionOrder[]; trxs: Transaction[] } {
  const d = (day: number) => new Date(now.getFullYear(), now.getMonth(), Math.min(day, dayOfMonth), 11).toISOString()
  const production: ProductionOrder[] = [
    {
      id: 'PR-118', productId: 'prd_3', qty: 800, status: 'completed', date: d(3),
      costs: { material: 6_800_000, labor: 3_200_000, energy: 1_100_000, logistics: 700_000, other: 400_000 },
      materials: [{ productId: 'prm_2', qty: 2 }],
    },
    {
      id: 'PR-119', productId: 'prd_11', qty: 1200, status: 'completed', date: addDays(nowISO, -16),
      costs: { material: 5_400_000, labor: 2_100_000, energy: 800_000, logistics: 500_000, other: 300_000 },
      materials: [{ productId: 'prm_1', qty: 1 }],
    },
    {
      id: 'PR-120', productId: 'prd_4', qty: 2000, status: 'in_progress', date: d(5),
      costs: { material: 9_600_000, labor: 2_800_000, energy: 900_000, logistics: 600_000, other: 500_000 },
      materials: [{ productId: 'prm_3', qty: 12 }],
    },
    {
      id: 'PR-121', productId: 'prd_1', qty: 600, status: 'in_progress', date: d(6),
      costs: { material: 12_400_000, labor: 3_600_000, energy: 1_300_000, logistics: 900_000, other: 600_000 },
      materials: [{ productId: 'prm_1', qty: 3 }],
    },
    {
      id: 'PR-122', productId: 'prd_8', qty: 900, status: 'planned', date: addDays(nowISO, 2),
      costs: { material: 7_800_000, labor: 1_900_000, energy: 600_000, logistics: 400_000, other: 300_000 },
      materials: [{ productId: 'prm_5', qty: 30 }],
    },
    {
      id: 'PR-117', productId: 'prd_5', qty: 500, status: 'rejected', date: addDays(nowISO, -9),
      costs: { material: 2_900_000, labor: 1_100_000, energy: 400_000, logistics: 200_000, other: 100_000 },
      materials: [],
    },
  ]
  const trxs: Transaction[] = production
    .filter((p) => p.status === 'completed' && new Date(p.date).getMonth() === now.getMonth())
    .map((p) => ({
      id: uid('trx'), date: p.date, type: 'expense' as const, category: 'Ishlab chiqarish xarajati',
      description: `Ishlab chiqarish buyrug‘i ${p.id} — tannarx`, amount: Object.values(p.costs).reduce((a, b) => a + b, 0),
      ref: { kind: 'production' as const, id: p.id },
    }))
  return { production, trxs }
}

const notifications: Notif[] = [
  { id: uid('ntf'), type: 'ai', title: 'AI CFO: marja xavfsizligi', message: 'Xomashyo xarajatlari oshishi sabab foyda marjasi 2.1% pasaydi. Tafsilotlar AI CFO’da.', time: addDays(nowISO, 0), read: false },
  { id: uid('ntf'), type: 'warehouse', title: 'Ombor: tugayotgan mahsulotlar', message: '4 ta mahsulot minimal qoldiqdan past: Qalam to‘plami, Yopishtiruvchi lenta, Doska tozalagich, A3 qog‘oz.', time: addDays(nowISO, 0), read: false },
  { id: uid('ntf'), type: 'debt', title: 'Qarzdorlik muddati o‘tdi', message: '2 ta debitor qarzi muddati o‘tgan. Jami 14.2 mln so‘m.', time: addDays(nowISO, -1), read: false },
  { id: uid('ntf'), type: 'finance', title: 'Yangi to‘lov qabul qilindi', message: 'Global Office MChJ buyurtma bo‘yicha to‘lov amalga oshirdi.', time: addDays(nowISO, -1), read: true },
  { id: uid('ntf'), type: 'system', title: 'Xarid tasdiqlandi', message: 'PO-2026-045 (Bek-Pack) tasdiqlandi — yetkazib berish 4 kundan keyin.', time: addDays(nowISO, -2), read: true },
  { id: uid('ntf'), type: 'ai', title: 'Haftalik hisobot tayyor', message: 'AI CFO haftalik moliyaviy tahlilni tayyorladi.', time: addDays(nowISO, -3), read: true },
  { id: uid('ntf'), type: 'finance', title: 'Ish haqi to‘lovi eslatmasi', message: 'Oylik ish haqi to‘lovi 5 kundan keyin. Jami 105.9 mln so‘m.', time: addDays(nowISO, -3), read: true },
]

const plan: PlanState = {
  name: 'TRIAL',
  cycle: 'monthly',
  trialEndsAt: addDays(nowISO, 23),
  nextPayment: addDays(nowISO, 23),
  seats: 5,
  invoices: [
    { id: uid('inv'), number: 'INV-2026-0312', date: addDays(nowISO, -7), amount: 0, status: 'paid', plan: 'TRIAL — 30 kun bepul' },
    { id: uid('inv'), number: 'INV-2026-0389', date: addDays(nowISO, 23), amount: 499000, status: 'upcoming', plan: 'PREMIUM (oylik)' },
  ],
}

const activity: ActivityLog[] = [
  { id: uid('act'), user: 'Odiljon Nazarov', action: 'AI CFO tahlilini ko‘rdi: foyda marjasi', time: addDays(nowISO, 0) },
  { id: uid('act'), user: 'Malika Tosheva', action: 'Xarajat tranzaksiyasini qo‘shdi: Marketing', time: addDays(nowISO, -1) },
  { id: uid('act'), user: 'Gulinur Saidova', action: 'Mahsulot qoldig‘ini yangiladi: Qalam to‘plami', time: addDays(nowISO, -1) },
  { id: uid('act'), user: 'Jasur Xolmatov', action: 'Yangi savdo buyurtmasi yaratdi: S-2026-1034', time: addDays(nowISO, -2) },
  { id: uid('act'), user: 'Odiljon Nazarov', action: 'Xaridni tasdiqladi: PO-2026-045', time: addDays(nowISO, -2) },
]

export const DEMO_USERS: (User & { active: boolean })[] = [
  { id: 'usr_1', name: 'Odiljon Nazarov', email: 'odiljon@osiyosavdo.uz', role: 'OWNER', phone: '+998 90 111-22-33', position: 'Bosh direktor', active: true },
  { id: 'usr_2', name: 'Malika Tosheva', email: 'malika@osiyosavdo.uz', role: 'ADMIN', phone: '+998 90 234-56-78', position: 'Bosh buxgalter', active: true },
  { id: 'usr_3', name: 'Sardor Aliyev', email: 'sardor@osiyosavdo.uz', role: 'ACCOUNTANT', phone: '+998 93 345-67-89', position: 'Buxgalter', active: true },
  { id: 'usr_4', name: 'Kamola Ergasheva', email: 'kamola@osiyosavdo.uz', role: 'MANAGER', phone: '+998 90 456-78-90', position: 'Savdo bo‘limi boshlig‘i', active: true },
  { id: 'usr_5', name: 'Jasur Xolmatov', email: 'jasur@osiyosavdo.uz', role: 'SALES', phone: '+998 97 567-89-01', position: 'Sotuv menejeri', active: true },
  { id: 'usr_6', name: 'Gulinur Saidova', email: 'gulinur@osiyosavdo.uz', role: 'WAREHOUSE', phone: '+998 94 678-90-12', position: 'Ombor mudiri', active: true },
  { id: 'usr_7', name: 'Rustam Qodirov', email: 'rustam@osiyosavdo.uz', role: 'HR', phone: '+998 90 789-01-23', position: 'HR mutaxassisi', active: false },
  { id: 'usr_8', name: 'Sherzod Yo‘ldoshev', email: 'sherzod@osiyosavdo.uz', role: 'PRODUCTION', phone: '+998 91 890-12-34', position: 'Ishlab chiqarish ustasi', active: true },
]

export function buildDemoData() {
  const { orders, transactions: orderTrxs } = buildOrders()
  const { purchases, trxs: purchaseTrxs } = buildPurchases()
  const { production, trxs: productionTrxs } = buildProduction()

  const company: Company = {
    id: 'cmp_1',
    name: 'Osiyo Savdo MChJ',
    type: 'Ulgurji savdo va ishlab chiqarish',
    employeesCount: '14',
    activity: 'Ofis mahsulotlari savdosi va qog‘oz ishlab chiqarish',
    modules: ['sales', 'customers', 'warehouse', 'purchases', 'production', 'accounting', 'finance', 'debts', 'hr', 'reports', 'analytics', 'ai'],
    taxId: '301234567',
    address: 'Toshkent sh., Chilonzor t., Bunyodkor 12',
    currency: 'UZS',
  }

  return {
    company,
    products,
    customers,
    orders,
    transactions: [...orderTrxs, ...buildHistoryTransactions(), ...buildCurrentMonthExpenses(), ...purchaseTrxs, ...productionTrxs],
    employees,
    suppliers,
    purchases,
    production,
    payments: [],
    notifications,
    plan,
    activity,
    users: DEMO_USERS,
    settings: {
      lowStockAlerts: true, dailyDigest: true, debtReminders: true, productionAlerts: true,
      emailNotifs: true, smsNotifs: false, compactMode: false,
    },
  }
}
