// BALANS AI — AI CFO engine: insights & chat answers computed from live store data
import {
  cashFlow, expenseBreakdown, forecastMonthEnd, healthScore, lowStockProducts,
  monthExpense, monthIncome, monthlySeries, outOfStockProducts, payables, productSales,
  receivables, todaySales,
} from './analytics'
import { formatCompact, formatUZS, MONTHS_UZ_FULL } from './utils'
import type { DataState } from './types'

export interface AISection { label: string; text: string }
export interface AIAnswer {
  title: string
  sections: AISection[]
  action?: { label: string; to: string }
  severity: 'good' | 'warn' | 'bad' | 'info'
}

export interface Insight {
  id: string
  type: 'profit' | 'expense' | 'stock' | 'debt' | 'cash' | 'production' | 'growth'
  severity: 'good' | 'warn' | 'bad' | 'info'
  title: string
  message: string
  action: { label: string; to: string }
}

export function buildInsights(state: DataState): Insight[] {
  const out: Insight[] = []
  const inc = monthIncome(state.transactions)
  const exp = monthExpense(state.transactions)
  const margin = inc > 0 ? ((inc - exp) / inc) * 100 : 0
  const low = lowStockProducts(state.products)
  const outStock = outOfStockProducts(state.products)
  const rec = receivables(state)
  const overdue = rec.filter((r) => r.overdue)
  const pay = payables(state)
  const now = new Date()
  const dayOf = now.getDate()
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const forecast = forecastMonthEnd(inc, dayOf, dim)
  const forecastExp = forecastMonthEnd(exp, dayOf, dim)
  const series = monthlySeries(state.transactions, 4)

  // profitability
  if (margin < 18) {
    out.push({
      id: 'ins_margin', type: 'profit', severity: margin < 10 ? 'bad' : 'warn',
      title: 'Foyda marjasi pasaygan',
      message: `Bu oy marja ${margin.toFixed(1)}% ni tashkil etdi. Xomashyo va ish haqi xarajatlari daromadning ${inc > 0 ? Math.round((exp / inc) * 100) : 0}% ini yutmoqda.`,
      action: { label: 'Xarajatlarni ko‘rish', to: '/finance' },
    })
  } else {
    out.push({
      id: 'ins_margin', type: 'profit', severity: 'good',
      title: 'Marja barqaror',
      message: `Bu oy foyda marjasi ${margin.toFixed(1)}% — sog‘lom ko‘rsatkich. Oy prognozi: ${formatCompact(forecast - forecastExp)} so‘m sof foyda.`,
      action: { label: 'Moliyani ochish', to: '/finance' },
    })
  }

  // low stock
  if (outStock.length > 0 || low.length > 0) {
    out.push({
      id: 'ins_stock', type: 'stock', severity: outStock.length > 0 ? 'bad' : 'warn',
      title: `${low.length + outStock.length} ta mahsulot xavf ostida`,
      message: outStock.length
        ? `${outStock.map((p) => p.name).join(', ')} — tugagan. Qolgan ${low.length} ta mahsulot minimal qoldiqdan past.`
        : `${low.slice(0, 3).map((p) => p.name).join(', ')} tugash arafasida — xaridni rejalashtiring.`,
      action: { label: 'Omborni ochish', to: '/warehouse' },
    })
  }

  // overdue debts
  if (overdue.length > 0) {
    out.push({
      id: 'ins_debt', type: 'debt', severity: overdue.length > 3 ? 'bad' : 'warn',
      title: `${overdue.length} ta qarz muddati o‘tgan`,
      message: `Debitorlar qarzi jami ${formatCompact(sum(overdue.map((r) => r.remaining)))} so‘m, shundan ${overdue.length} ta buyurtma muddati o‘tgan. ${overdue[0].customerName} — eng katta qarzdor.`,
      action: { label: 'Qarzlarni ko‘rish', to: '/debts' },
    })
  }

  // cash
  const cash = cashFlow(state.transactions)
  out.push({
    id: 'ins_cash', type: 'cash', severity: cash > 200_000_000 ? 'good' : cash > 50_000_000 ? 'info' : 'warn',
    title: `Cash flow: ${formatCompact(cash)} so‘m`,
    message: cash > 200_000_000
      ? 'Pul aylanmasi barqaror. Kutilayotgan to‘lovlar bilan yanada mustahkamlanadi.'
      : `Pul aylanmasi cheklangan. ${rec.length > 0 ? `${rec.length} ta kutilayotgan to‘lovni yig‘ish ahvolni yaxshilaydi.` : 'Xarajatlarni optimallashtirish tavsiya etiladi.'}`,
    action: { label: 'Moliyaviy tahlil', to: '/finance' },
  })

  // expense growth
  const expNow = monthExpense(state.transactions)
  const expPrevMonth = series.length >= 2 ? series[series.length - 2].expense : 0
  const dayOf2 = new Date().getDate()
  const dim2 = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  if (expPrevMonth > 0 && forecastMonthEnd(expNow, dayOf2, dim2) > expPrevMonth * 1.06) {
    out.push({
      id: 'ins_exp', type: 'expense', severity: 'warn',
      title: 'Xarajatlar o‘sishda',
      message: `Xarajatlar prognozi ${formatCompact(forecastMonthEnd(expNow, dayOf2, dim2))} so‘m — o‘tgan oyga nisbatan ${Math.round((forecastMonthEnd(expNow, dayOf2, dim2) / expPrevMonth - 1) * 100)}% ko‘proq. Asosiy sabab: ${expenseBreakdown(state.transactions)[0]?.category ?? 'xomashyo'}.`,
      action: { label: 'Xarajat tarkibini ko‘rish', to: '/analytics' },
    })
  }

  // growth
  if (series.length >= 2) {
    const prev = series[series.length - 2].income
    if (prev > 0) {
      const delta = Math.round(((forecast / prev) - 1) * 100)
      if (delta >= 0) {
        out.push({
          id: 'ins_growth', type: 'growth', severity: 'good',
          title: `O‘sish prognozi: +${delta}%`,
          message: `Bu oy tushum prognozi ${formatCompact(forecast)} so‘m — o‘tgan oydan ${delta}% yuqori. Eng yaxshi sotuvchi: ${productSales(state)[0]?.product.name}.`,
          action: { label: 'Analitikani ochish', to: '/analytics' },
        })
      }
    }
  }

  // production
  const inProgress = state.production.filter((p) => p.status === 'in_progress').length
  if (inProgress > 0) {
    out.push({
      id: 'ins_prod', type: 'production', severity: 'info',
      title: `${inProgress} ta ishlab chiqarish jarayonda`,
      message: 'Tayyor mahsulotlar omborga avtomatik kiritiladi. Xomashyo zaxirasini kuzatib boring.',
      action: { label: 'Ishlab chiqarishni ko‘rish', to: '/production' },
    })
  }

  return out
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

export function aiAnswer(state: DataState, prompt: string): AIAnswer {
  const p = prompt.toLowerCase()
  const inc = monthIncome(state.transactions)
  const exp = monthExpense(state.transactions)
  const profit = inc - exp
  const margin = inc > 0 ? (profit / inc) * 100 : 0
  const now = new Date()
  const monthName = MONTHS_UZ_FULL[now.getMonth()]
  const dayOf = now.getDate()
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const forecast = forecastMonthEnd(inc, dayOf, dim)
  const forecastProfit = forecastMonthEnd(profit, dayOf, dim)
  const series = monthlySeries(state.transactions, 4)
  const has = (...keys: string[]) => keys.some((k) => p.includes(k))

  // BUGUNGI TAHLIL
  if (has('bugun', 'bugungi', 'kunlik', 'bugungi biznes', 'tahlil qil')) {
    return {
      title: `Bugungi biznes holati — ${monthName} ${now.getDate()}`,
      severity: profit > 0 ? 'good' : 'warn',
      sections: [
        { label: 'Holat', text: `Bugungi savdo: ${formatCompact(todaySales(state.orders))} so‘m. Oy boshidan: ${formatCompact(inc)} so‘m tushum, ${formatCompact(exp)} so‘m xarajat. Sof foyda: ${formatCompact(profit)} so‘m (marja ${margin.toFixed(1)}%).` },
        { label: 'Diqqat markazi', text: buildInsights(state).filter((i) => i.severity !== 'good').slice(0, 2).map((i) => `${i.title} — ${i.message}`).join(' ') || 'Kritik ogohlantirishlar yo‘q. Jarayonlar nazorat ostida.' },
        { label: 'Tavsiya', text: `Oy yakuniga prognoz: ${formatCompact(forecast)} so‘m tushum va ~${formatCompact(forecastProfit)} so‘m sof foyda. Debitor qarzlarini faol yig‘ish davom etsin.` },
        { label: 'Keyingi qadam', text: 'Quyidagi tugma orqali batafsil moliyaviy hisobotni oching.' },
      ],
      action: { label: 'Moliyaviy hisobotni ochish', to: '/finance' },
    }
  }

  // FOYDA / MARJA
  if (has('foyda', 'foydam', 'marja', 'marj')) {
    const prev = series.length >= 2 ? series[series.length - 2] : null
    return {
      title: 'Foyda tahlili',
      severity: margin < 15 ? 'warn' : 'good',
      sections: [
        { label: 'Muammo', text: margin < 15 ? `Bu oy foyda marjasi ${margin.toFixed(1)}% — maqsadli 20% dan past.` : `Marja ${margin.toFixed(1)}% — sog‘lom diapazonda.` },
        { label: 'Sabab', text: `Xarajatlar tushumning ${inc > 0 ? Math.round((exp / inc) * 100) : 0}% ini tashkil etadi. Eng katta xarajat: ${expenseBreakdown(state.transactions)[0]?.category ?? '—'} (${formatCompact(expenseBreakdown(state.transactions)[0]?.amount ?? 0)} so‘m).${prev ? ` O‘tgan oy marja: ${prev.income > 0 ? (((prev.income - prev.expense) / prev.income) * 100).toFixed(1) : '0'}%.` : ''}` },
        { label: 'Ta’sir', text: `Oy yakuniga prognoz: ${formatCompact(forecastProfit)} so‘m sof foyda. Marja tiklanmasa, keyingi oyda ${formatCompact(forecastProfit * 0.92)} so‘mga tushishi mumkin.` },
        { label: 'Tavsiya', text: `Top 3 xarajat toifasini qayta ko‘rib chiqing va xomashyo narxlarini 3 ta yetkazib beruvchi bilan solishtiring. Eng foydali mahsulot: ${productSales(state).filter((s) => s.product.type === 'finished')[0]?.product.name ?? '—'}.` },
        { label: 'Action', text: 'Quyidagi tugma orqali xarajatlar tarkibini oching.' },
      ],
      action: { label: 'Xarajatlarni ko‘rish', to: '/finance' },
    }
  }

  // ENG KATTA XARAJAT
  if (has('xarajat', 'xarajatlar')) {
    const bd = expenseBreakdown(state.transactions)
    const top = bd[0] ?? { category: '—', amount: 0 }
    const second = bd[1] ?? { category: '—', amount: 0 }
    return {
      title: 'Xarajatlar tarkibi',
      severity: 'info',
      sections: [
        { label: 'Topilma', text: `Bu oyning eng katta xarajati: ${top.category} — ${formatUZS(top.amount)} (jami xarajatning ${exp > 0 ? Math.round((top.amount / exp) * 100) : 0}%).` },
        { label: 'Dinamika', text: `Ikkinchi o‘rin: ${second.category} — ${formatCompact(second.amount)} so‘m. Oy prognozi bo‘yicha jami xarajat: ${formatCompact(forecastMonthEnd(exp, dayOf, dim))} so‘m.` },
        { label: 'Ta’sir', text: `${top.category} 10% optimallashsa, oyiga ~${formatCompact(top.amount * 0.1 * (dim / Math.max(1, dayOf)))} so‘m tejalgan bo‘lardi.` },
        { label: 'Tavsiya', text: `${top.category} bo‘yicha shartnomalarni qayta ko‘rib chiqing va alternativ yetkazib beruvchilardan taklif so‘rang.` },
        { label: 'Action', text: 'Xarajat tarkibini analitikada batafsil ko‘ring.' },
      ],
      action: { label: 'Xarajat tahlilini ochish', to: '/analytics' },
    }
  }

  // ENG FOYDALI MAHSULOT
  if (has('mahsulot', 'tovar', 'foyda.*mahsulot', 'sotiladigan')) {
    const sales = productSales(state).filter((s) => s.qty > 0)
    const best = sales[0]
    const byProfit = [...sales].sort((a, b) => b.profit - a.profit)[0]
    return {
      title: 'Mahsulot tahlili',
      severity: 'good',
      sections: [
        { label: 'Topilma', text: best ? `Eng ko‘p sotilgan: ${best.product.name} — ${best.qty} dona, ${formatCompact(best.revenue)} so‘m tushum.` : 'Hozircha savdo ma’lumoti yo‘q.' },
        { label: 'Foyda', text: byProfit ? `Eng foydali: ${byProfit.product.name} — marja ${(byProfit.margin * 100).toFixed(0)}%, jami foyda ${formatCompact(byProfit.profit)} so‘m.` : '' },
        { label: 'Ta’sir', text: `Bu mahsulotlar savdo hajmiga bevosita ta’sir qiladi — ombor qoldig‘ini kuzatib boring.` },
        { label: 'Tavsiya', text: best ? `${best.product.name} bo‘yicha aksiyalar va to‘plam takliflari savdoni yanada oshiradi. Kam marjali mahsulotlarni qayta narxlang.` : 'Yangi mahsulot qo‘shib savdoni boshlang.' },
        { label: 'Action', text: 'Ombor va savdo tahlilini oching.' },
      ],
      action: { label: 'Omborni ochish', to: '/warehouse' },
    }
  }

  // CASH FLOW
  if (has('cash', 'pul', 'likvid', 'aylanma')) {
    const cash = cashFlow(state.transactions)
    const rec = receivables(state)
    const pay = payables(state)
    return {
      title: 'Cash flow tahlili',
      severity: cash < 50_000_000 ? 'warn' : 'good',
      sections: [
        { label: 'Holat', text: `Jami cash flow: ${formatUZS(cash)}. Bu oy tushum ${formatCompact(inc)} so‘m, xarajat ${formatCompact(exp)} so‘m.` },
        { label: 'Kutilayotgan', text: `Debitorlardan kutilayotgan: ${formatCompact(sum(rec.map((r) => r.remaining)))} so‘m. Yetkazib beruvchilarga qarz: ${formatCompact(sum(pay.map((x) => x.purchase.amount)))} so‘m.` },
        { label: 'Ta’sir', text: cash < 50_000_000 ? 'Likvidlik chegarada — yangi katta xaridlarni ehtiyotkorlik bilan rejalashtiring.' : 'Likvidlik yetarli — o‘sishga investitsiya kiritish mumkin.' },
        { label: 'Tavsiya', text: 'Qarzlarni yig‘ishni tezlashtiring va xaridlarni to‘lov kalendariga moslang.' },
        { label: 'Action', text: 'Qarzdorlik bo‘limini oching.' },
      ],
      action: { label: 'Qarzlarni ko‘rish', to: '/debts' },
    }
  }

  // QARZ / DEBT
  if (has('qarz', 'qarzdor', 'debitor', 'kreditor', 'muddati')) {
    const rec = receivables(state)
    const overdue = rec.filter((r) => r.overdue)
    return {
      title: 'Qarzdorlik tahlili',
      severity: overdue.length > 2 ? 'bad' : overdue.length > 0 ? 'warn' : 'good',
      sections: [
        { label: 'Muammo', text: overdue.length ? `${overdue.length} ta qarz muddati o‘tgan, jami ${formatCompact(sum(overdue.map((r) => r.remaining)))} so‘m.` : 'Muddati o‘tgan qarz yo‘q — ajoyib.' },
        { label: 'Sabab', text: rec.length ? `Jami ${rec.length} ta buyurtma to‘lanmagan. Eng katta qarzdor: ${rec[0].customerName} (${formatCompact(rec[0].remaining)} so‘m).` : '' },
        { label: 'Ta’sir', text: `Bu mablag‘ cash flow’ga to‘g‘ridan-to‘g‘ri ta’sir qiladi — ${rec.length ? formatCompact(sum(rec.map((r) => r.remaining))) : 0} so‘m aylanmadan tashqarida.` },
        { label: 'Tavsiya', text: 'Eng eski qarzlardan boshlab eslatma yuboring va keyingi savdolarni avans to‘lovga o‘tkazing.' },
        { label: 'Action', text: 'Qarzdorlik bo‘limida eslatma yuborish tugmasi mavjud.' },
      ],
      action: { label: 'Qarzlarni boshqarish', to: '/debts' },
    }
  }

  // OMBOR
  if (has('ombor', 'stock', 'qoldiq', 'tugay')) {
    const low = lowStockProducts(state.products)
    const outS = outOfStockProducts(state.products)
    return {
      title: 'Ombor risk tahlili',
      severity: outS.length ? 'bad' : low.length ? 'warn' : 'good',
      sections: [
        { label: 'Muammo', text: outS.length || low.length ? `${outS.length} ta mahsulot tugagan, ${low.length} ta minimal qoldiqdan past.` : 'Barcha mahsulotlar yetarli darajada.' },
        { label: 'Sabab', text: outS.length ? `${outS.map((x) => x.name).join(', ')} savdo tezligiga mos xarid rejalashtirilmagan.` : 'Savdo dinamikasi xarid rejasidan oldingi.' },
        { label: 'Ta’sir', text: `Tugagan mahsulotlar oyiga ~${formatCompact(outS.reduce((s, x) => s + x.minStock * x.salePrice * 0.5, 0))} so‘m potensial tushum yo‘qotishiga olib keladi.` },
        { label: 'Tavsiya', text: 'Yetkazib beruvchilar bilan narxlarni solishtirib, xarid buyurtmalarini hoziroq yarating.' },
        { label: 'Action', text: 'Xaridlar bo‘limini oching.' },
      ],
      action: { label: 'Xarid yaratish', to: '/purchases' },
    }
  }

  // SAVDO
  if (has('savdo', 'sotuv', 'tushum', 'daromad', 'pasay')) {
    const today = todaySales(state.orders)
    return {
      title: 'Savdo tahlili',
      severity: 'info',
      sections: [
        { label: 'Holat', text: `Bugungi savdo: ${formatUZS(today)}. Bu oy jami: ${formatCompact(inc)} so‘m, prognoz: ${formatCompact(forecast)} so‘m.` },
        { label: 'Dinamika', text: series.length >= 2 ? `O‘tgan oy tushum: ${formatCompact(series[series.length - 2].income)} so‘m. ${forecast > series[series.length - 2].income ? 'Bu oy o‘sish kutilmoqda.' : 'Pasayish tendensiyasi kuzatilmoqda.'}` : '' },
        { label: 'Yetakchi', text: `Eng faol mijozlar bazasidagi eng katta buyurtma: ${formatCompact(state.orders[0]?.amount ?? 0)} so‘m.` },
        { label: 'Tavsiya', text: 'Mavsumiy takliflar va doimiy mijozlarga shaxsiy chegirmalar savdoni oshiradi.' },
        { label: 'Action', text: 'Savdo bo‘limini oching.' },
      ],
      action: { label: 'Savdoni boshqarish', to: '/sales' },
    }
  }

  // DEFAULT — umumiy tahlil
  const hs = healthScore(state)
  return {
    title: 'BALANS AI — umumiy biznes tahlili',
    severity: hs.score >= 75 ? 'good' : hs.score >= 55 ? 'info' : 'warn',
    sections: [
      { label: 'Holat', text: `Moliyaviy salomatlik balli: ${hs.score}/100. Bu oy: tushum ${formatCompact(inc)} so‘m, xarajat ${formatCompact(exp)} so‘m, sof foyda ${formatCompact(profit)} so‘m.` },
      { label: 'Kuchli tomonlar', text: hs.parts.filter((x) => x.score / x.max >= 0.7).map((x) => x.label).join(', ') || 'Jarayonlar barqaror.' },
      { label: 'Diqqat', text: hs.parts.filter((x) => x.score / x.max < 0.5).map((x) => x.label).join(', ') || 'Kritik ogohlantirishlar yo‘q.' },
      { label: 'Tavsiya', text: `Tavsiyalarim: debitor qarzlarini yig‘ing, tugayotgan mahsulotlarga xarid yaratib oling va marjani ${margin.toFixed(0)}% dan 20% gacha oshirish uchun narxlarni qayta ko‘rib chiqing.` },
      { label: 'Keyingi qadam', text: 'Savol joumlaridan birini tanlang yoki o‘zingizga kerakli savolni yozing.' },
    ],
    action: { label: 'Dashboardni ochish', to: '/dashboard' },
  }
}

export const QUICK_PROMPTS = [
  'Bugungi biznesimni tahlil qil',
  'Foydam nega kamaydi?',
  'Eng katta xarajat nima?',
  'Qaysi mahsulot eng foydali?',
  'Cash flow qanday?',
  'Qarzdorlik holati qanday?',
  'Omborda nimalar tugayapti?',
]
