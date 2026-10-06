import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Bot, ChevronRight, Download, Factory, FileBarChart, Filter,
  Package, Receipt, ShoppingCart, Users, Wallet, X,
} from 'lucide-react'
import { useData } from '../../lib/store'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button } from '../../components/ui/primitives'
import { Modal } from '../../components/ui/modals'
import { useToast } from '../../components/ui/toast'
import { downloadCSV, formatCompact, formatDate } from '../../lib/utils'
import {
  cashFlow, expenseBreakdown, inventoryValue, monthExpense, monthIncome,
  monthlySeries, productSales, receivables,
} from '../../lib/analytics'

interface ReportDef {
  id: string
  category: 'Moliya' | 'Savdo' | 'Ombor' | 'Xaridlar' | 'Ishlab chiqarish' | 'HR'
  title: string
  desc: string
  icon: React.ReactNode
}

const REPORTS: ReportDef[] = [
  { id: 'fin-summary', category: 'Moliya', title: 'Moliyaviy yakuniy hisobot', desc: 'Tushum, xarajat, foyda va cash flow — 12 oy kesimida.', icon: <Wallet /> },
  { id: 'fin-profit', category: 'Moliya', title: 'Foyda va marja tahlili', desc: 'Oylik sof foyda dinamikasi va marja o‘zgarishlari.', icon: <BarChart3 /> },
  { id: 'fin-expense', category: 'Moliya', title: 'Xarajatlar hisoboti', desc: 'Toifalar kesimida xarajat tarkibi va o‘sish.', icon: <Receipt /> },
  { id: 'sales-orders', category: 'Savdo', title: 'Savdo hisoboti', desc: 'Buyurtmalar, to‘lovlar holati va o‘rtacha chek.', icon: <ShoppingCart /> },
  { id: 'sales-products', category: 'Savdo', title: 'Mahsulotlar kesimida savdo', desc: 'Eng ko‘p sotilgan va eng foydali mahsulotlar.', icon: <Package /> },
  { id: 'sales-customers', category: 'Savdo', title: 'Mijozlar hisoboti', desc: 'Eng faol mijozlar, xarid hajmi va qarzlar.', icon: <Users /> },
  { id: 'wh-stock', category: 'Ombor', title: 'Ombor qoldig‘i hisoboti', desc: 'Qoldiqlar, qiymat va xavf ogohlantirishlari.', icon: <Package /> },
  { id: 'wh-movements', category: 'Ombor', title: 'Inventar harakatlari', desc: 'Kirim-chiqim tarixi manbalar kesimida.', icon: <BarChart3 /> },
  { id: 'pur-suppliers', category: 'Xaridlar', title: 'Xaridlar hisoboti', desc: 'Yetkazib beruvchilar va xarid hajmi.', icon: <Filter /> },
  { id: 'prod-cost', category: 'Ishlab chiqarish', title: 'Tannarx hisoboti', desc: 'Buyruqlar kesimida tannarx va birlik narx.', icon: <Factory /> },
  { id: 'hr-payroll', category: 'HR', title: 'Ish haqi hisoboti', desc: 'Bo‘limlar kesimida ish haqi fondiva samaradorlik.', icon: <Users /> },
  { id: 'ai-insight', category: 'Moliya', title: 'AI CFO — moliyaviy tashxis', desc: 'AI tomonidan tayyorlangan biznes tahlili.', icon: <Bot /> },
]

export default function Reports() {
  const { data, dispatch } = useData()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [category, setCategory] = useState('Barchasi')
  const [open, setOpen] = useState<ReportDef | null>(null)
  const [period, setPeriod] = useState('Bu oy')

  const categories = ['Barchasi', 'Moliya', 'Savdo', 'Ombor', 'Xaridlar', 'Ishlab chiqarish', 'HR']
  const list = REPORTS.filter((r) => category === 'Barchasi' || r.category === category)

  const monthly = monthlySeries(data.transactions, 12)
  const sales = productSales(data).filter((s) => s.qty > 0)
  const rec = receivables(data)
  const exp = expenseBreakdown(data.transactions)

  const exportCurrent = (r: ReportDef) => {
    const rows: (string | number)[][] = []
    let name = 'hisobot'
    if (r.id === 'fin-summary') {
      name = 'moliyaviy-yakuniy'
      rows.push(['Oy', 'Tushum', 'Xarajat', 'Sof foyda'], ...monthly.map((m) => [m.label, m.income, m.expense, m.profit]))
    } else if (r.id === 'sales-products' || r.id === 'wh-stock') {
      name = r.id
      rows.push(['Mahsulot', 'SKU', 'Qoldiq', 'Sotilgan', 'Tushum', 'Foyda'], ...sales.map((s) => [s.product.name, s.product.sku, s.product.stock, s.qty, s.revenue, s.profit]))
    } else if (r.id === 'sales-customers') {
      name = 'mijozlar-hisoboti'
      rows.push(['Mijoz', 'Telefon', 'Buyurtmalar', 'Jami xarid'], ...data.customers.map((c) => {
        const cs = data.orders.filter((o) => o.customerId === c.id)
        return [c.name, c.phone, cs.length, cs.reduce((s, o) => s + o.amount, 0)]
      }))
    } else if (r.id === 'fin-expense') {
      name = 'xarajatlar'
      rows.push(['Toifa', 'Summa'], ...exp.map((e) => [e.category, e.amount]))
    } else if (r.id === 'hr-payroll') {
      name = 'ish-haqi'
      rows.push(['Xodim', 'Bo‘lim', 'Lavozim', 'Ish haqi'], ...data.employees.map((e) => [e.name, e.department, e.position, e.salary]))
    } else if (r.id === 'pur-suppliers') {
      name = 'xaridlar'
      rows.push(['Yetkazib beruvchi', 'Xaridlar soni', 'Jami summa'], ...data.suppliers.map((s) => {
        const ps = data.purchases.filter((p) => p.supplierId === s.id)
        return [s.name, ps.length, ps.reduce((a, p) => a + p.amount, 0)]
      }))
    } else {
      name = r.id
      rows.push(['Hisobot', r.title], ['Kompaniya', data.company.name], ['Sana', formatDate(new Date().toISOString())])
      rows.push(['Tushum (bu oy)', monthIncome(data.transactions)], ['Xarajat (bu oy)', monthExpense(data.transactions)], ['Cash flow', cashFlow(data.transactions)])
    }
    downloadCSV(`${name}.csv`, rows)
    toast('success', 'Hisobot eksport qilindi.', `${name}.csv`)
  }

  const renderReportBody = (r: ReportDef) => {
    switch (r.id) {
      case 'fin-summary':
        return (
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Oy</th><th className="right">Tushum</th><th className="right">Xarajat</th><th className="right">Sof foyda</th><th className="right">Marja</th></tr></thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.key}>
                    <td className="fw-6">{m.label}</td>
                    <td className="right mono">{formatCompact(m.income)}</td>
                    <td className="right mono">{formatCompact(m.expense)}</td>
                    <td className={`right mono fw-6 ${m.profit >= 0 ? 't-success' : 't-danger'}`}>{formatCompact(m.profit)}</td>
                    <td className="right mono">{m.income > 0 ? `${Math.round((m.profit / m.income) * 100)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'sales-products':
        return (
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Mahsulot</th><th className="right">Sotilgan</th><th className="right">Tushum</th><th className="right">Foyda</th><th className="right">Marja</th></tr></thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.product.id}>
                    <td><span className="fw-6 fs-13">{s.product.name}</span><p className="fs-11 text-3 mono">{s.product.sku}</p></td>
                    <td className="right mono">{s.qty}</td>
                    <td className="right mono">{formatCompact(s.revenue)}</td>
                    <td className="right mono t-success">{formatCompact(s.profit)}</td>
                    <td className="right mono">{Math.round(s.margin * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'sales-customers':
        return (
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Mijoz</th><th className="right">Buyurtma</th><th className="right">Jami xarid</th><th className="right">Qarz</th></tr></thead>
              <tbody>
                {data.customers.map((c) => {
                  const cs = data.orders.filter((o) => o.customerId === c.id)
                  const total = cs.reduce((s, o) => s + o.amount, 0)
                  const debt = cs.reduce((s, o) => s + (o.amount - o.paidAmount), 0)
                  return (
                    <tr key={c.id}>
                      <td className="fw-6 fs-13">{c.name}</td>
                      <td className="right mono">{cs.length}</td>
                      <td className="right mono">{formatCompact(total)}</td>
                      <td className={`right mono ${debt > 0 ? 't-danger' : 'text-3'}`}>{debt > 0 ? formatCompact(debt) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      case 'wh-stock':
        return (
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Mahsulot</th><th className="right">Qoldiq</th><th className="right">Min.</th><th className="right">Qiymat</th><th>Holat</th></tr></thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id}>
                    <td><span className="fw-6 fs-13">{p.name}</span><p className="fs-11 text-3">{p.category}</p></td>
                    <td className="right mono">{p.stock} {p.unit}</td>
                    <td className="right mono text-3">{p.minStock}</td>
                    <td className="right mono">{formatCompact(p.stock * p.costPrice)}</td>
                    <td>{p.stock === 0 ? <Badge variant="danger">Tugagan</Badge> : p.stock <= p.minStock ? <Badge variant="warning">Kam</Badge> : <Badge variant="success">OK</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'fin-expense':
        return (
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Toifa</th><th className="right">Summa</th><th className="right">Ulush</th></tr></thead>
              <tbody>
                {exp.map((e) => (
                  <tr key={e.category}>
                    <td className="fw-6 fs-13">{e.category}</td>
                    <td className="right mono">{formatCompact(e.amount)}</td>
                    <td className="right mono">{Math.round((e.amount / exp.reduce((s, x) => s + x.amount, 0)) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'hr-payroll':
        return (
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Xodim</th><th>Bo‘lim</th><th className="right">Ish haqi</th><th className="right">Samara</th></tr></thead>
              <tbody>
                {data.employees.map((e) => (
                  <tr key={e.id}>
                    <td className="fw-6 fs-13">{e.name}</td>
                    <td><Badge variant="neutral">{e.department}</Badge></td>
                    <td className="right mono">{formatCompact(e.salary)}</td>
                    <td className="right mono">{e.performance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'pur-suppliers':
        return (
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Yetkazib beruvchi</th><th className="right">Xaridlar</th><th className="right">Jami</th><th className="right">Reyting</th></tr></thead>
              <tbody>
                {data.suppliers.map((s) => {
                  const ps = data.purchases.filter((p) => p.supplierId === s.id)
                  return (
                    <tr key={s.id}>
                      <td className="fw-6 fs-13">{s.name}</td>
                      <td className="right mono">{ps.length}</td>
                      <td className="right mono">{formatCompact(ps.reduce((a, p) => a + p.amount, 0))}</td>
                      <td className="right mono t-accent">★ {s.rating}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      case 'prod-cost':
        return (
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Buyruq</th><th>Mahsulot</th><th className="right">Miqdor</th><th className="right">Tannarx</th><th className="right">Birlik</th><th>Holat</th></tr></thead>
              <tbody>
                {data.production.map((p) => {
                  const prod = data.products.find((x) => x.id === p.productId)
                  const tc = Object.values(p.costs).reduce((a, b) => a + b, 0)
                  return (
                    <tr key={p.id}>
                      <td className="mono fw-6">{p.id}</td>
                      <td className="fs-13">{prod?.name}</td>
                      <td className="right mono">{p.qty}</td>
                      <td className="right mono">{formatCompact(tc)}</td>
                      <td className="right mono">{formatCompact(tc / p.qty)}</td>
                      <td className="fs-12 text-2">{p.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      case 'ai-insight':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Tushum (bu oy)', v: formatCompact(monthIncome(data.transactions)) },
              { label: 'Xarajat (bu oy)', v: formatCompact(monthExpense(data.transactions)) },
              { label: 'Cash flow', v: formatCompact(cashFlow(data.transactions)) },
              { label: 'Ombor qiymati', v: formatCompact(inventoryValue(data.products)) },
              { label: 'Debitor qarz', v: formatCompact(rec.reduce((s, r) => s + r.remaining, 0)) },
            ].map((x) => (
              <div key={x.label} className="stat-mini"><span className="text-2 fs-13">{x.label}</span><span className="mono fw-7">{x.v}</span></div>
            ))}
            <div className="card mt-2" style={{ background: 'var(--accent-soft)', border: '1px solid rgba(139,92,246,.3)', padding: 15 }}>
              <p className="fs-12" style={{ lineHeight: 1.7 }}>
                <b className="t-accent">AI CFO xulosasi:</b> {data.company.name} uchun bu oy {formatCompact(monthIncome(data.transactions))} so‘m tushum
                va {formatCompact(monthExpense(data.transactions))} so‘m xarajat qayd etildi. Batafsil tahlil uchun AI CFO bo‘limiga o‘ting.
              </p>
              <Button size="sm" variant="primary" className="mt-2" onClick={() => { setOpen(null); navigate('/ai-cfo') }}>AI CFO’ni ochish</Button>
            </div>
          </div>
        )
      default:
        return <p className="text-2 fs-13">Hisobot tarkibi tez orada tayyorlanadi — boshqa hisobotlarni ko‘ring.</p>
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Hisobotlar"
        sub="Professional hisobot markazi — barcha modullardan avtomatik yig‘iladi."
      />

      <div className="chip-row mb-3">
        {categories.map((c) => (
          <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      <div className="grid-3">
        {list.map((r) => (
          <div key={r.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="kpi-icon">{r.icon}</div>
              <Badge variant="neutral">{r.category}</Badge>
            </div>
            <h3 style={{ fontSize: 15.5, marginTop: 14 }}>{r.title}</h3>
            <p className="fs-13 text-2 mt-1 flex-1" style={{ lineHeight: 1.6, marginTop: 6 }}>{r.desc}</p>
            <div className="row" style={{ gap: 8, marginTop: 16 }}>
              <Button size="sm" variant="primary" onClick={() => setOpen(r)}><FileBarChart />Ochish</Button>
              <Button size="sm" onClick={() => exportCurrent(r)}><Download />Export</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!open} onClose={() => setOpen(null)}
        title={open?.title ?? ''}
        subtitle={`${open?.category} • ${data.company.name}`}
        size="lg"
        footer={
          <>
            <Button onClick={() => setOpen(null)}><X />Yopish</Button>
            <Button variant="primary" onClick={() => open && exportCurrent(open)}><Download />CSV eksport</Button>
          </>
        }
      >
        {open && (
          <>
            <div className="row wrap mb-2" style={{ justifyContent: 'space-between' }}>
              <div className="chip-row">
                {['Bu oy', 'O‘tgan oy', 'Chorak', 'Yil'].map((p) => (
                  <button key={p} className={`chip ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
              <span className="fs-12 text-3">{formatDate(new Date().toISOString())} holatiga ko‘ra</span>
            </div>
            {renderReportBody(open)}
          </>
        )}
      </Modal>
    </div>
  )
}
