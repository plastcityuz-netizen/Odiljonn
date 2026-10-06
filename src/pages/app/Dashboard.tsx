import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDownRight, ArrowUpRight, Bot, Package, Receipt, ShoppingCart, Wallet, Boxes,
  TrendingUp, TrendingDown, AlertTriangle, Sparkles, ChevronRight, Users, Truck,
} from 'lucide-react'
import { useData } from '../../lib/store'
import { useAuth } from '../../lib/auth'
import { PageHeader } from '../../components/ui/PageHeader'
import { AreaChart, BarChart, DonutChart, ProgressRing } from '../../components/charts/Charts'
import { Avatar, Badge, Button } from '../../components/ui/primitives'
import { formatCompact, formatDate, formatUZS, percent, timeAgo } from '../../lib/utils'
import {
  cashFlow, expenseBreakdown, forecastMonthEnd, healthScore, inventoryValue, lowStockProducts,
  monthExpense, monthIncome, monthlySeries, outOfStockProducts, payables, receivables, todaySales,
} from '../../lib/analytics'
import { buildInsights } from '../../lib/ai'
import { can } from '../../lib/permissions'

const SEV_COLORS = { good: 'var(--success)', warn: 'var(--warning)', bad: 'var(--danger)', info: 'var(--info)' } as const

export default function Dashboard() {
  const { data } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [range, setRange] = useState<'6' | '12'>('6')

  const inc = monthIncome(data.transactions)
  const exp = monthExpense(data.transactions)
  const profit = inc - exp
  const prevInc = monthlySeries(data.transactions, 2)[0]?.income ?? 0
  const prevExp = monthlySeries(data.transactions, 2)[0]?.expense ?? 0
  const series = useMemo(
    () => monthlySeries(data.transactions, parseInt(range)).map((m) => ({ label: m.label, values: [m.income, m.expense] })),
    [data.transactions, range]
  )
  const profitSeries = useMemo(() => monthlySeries(data.transactions, parseInt(range)).map((m) => ({ label: m.label, values: [m.profit] })), [data.transactions, range])
  const rec = receivables(data)
  const pay = payables(data)
  const low = lowStockProducts(data.products)
  const outS = outOfStockProducts(data.products)
  const insights = useMemo(() => buildInsights(data), [data])
  const hs = useMemo(() => healthScore(data), [data])
  const today = todaySales(data.orders)
  const invValue = inventoryValue(data.products)
  const role = user?.role ?? 'OWNER'

  const recentOrders = data.orders.slice(0, 6)
  const recentTrxs = [...data.transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6)
  const nowD = new Date()
  const dimNow = new Date(nowD.getFullYear(), nowD.getMonth() + 1, 0).getDate()
  const forecastInc = forecastMonthEnd(inc, nowD.getDate(), dimNow)
  const forecastExp = forecastMonthEnd(exp, nowD.getDate(), dimNow)

  const kpis = [
    { label: 'Bugungi savdo', value: formatCompact(today), icon: <ShoppingCart />, to: '/sales', delta: 'bugungi holat', deltaUp: true, perm: 'sales' as const },
    { label: 'Oylik tushum', value: formatCompact(inc), icon: <Wallet />, to: '/finance', delta: `prognoz ${formatCompact(forecastInc)}`, deltaUp: forecastInc >= prevInc, perm: 'finance' as const },
    { label: 'Sof foyda', value: formatCompact(profit), icon: profit >= 0 ? <TrendingUp /> : <TrendingDown />, to: '/finance', delta: `marja ${inc > 0 ? Math.round((profit / inc) * 100) : 0}%`, deltaUp: profit >= 0, perm: 'finance' as const },
    { label: 'Xarajatlar', value: formatCompact(exp), icon: <ArrowDownRight />, to: '/finance', delta: `prognoz ${formatCompact(forecastExp)}`, deltaUp: forecastExp <= prevExp, perm: 'finance' as const },
    { label: 'Cash Flow', value: formatCompact(cashFlow(data.transactions)), icon: <Boxes />, to: '/finance', delta: 'jami balans', deltaUp: true, perm: 'finance' as const },
    { label: 'Debitor', value: formatCompact(rec.reduce((s, r) => s + r.remaining, 0)), icon: <Receipt />, to: '/debts', delta: `${rec.length} ta buyurtma`, deltaUp: false, perm: 'debts' as const },
    { label: 'Kreditor', value: formatCompact(pay.reduce((s, p) => s + p.purchase.amount, 0)), icon: <Truck />, to: '/debts', delta: `${pay.length} ta xarid`, deltaUp: false, perm: 'debts' as const },
    { label: 'Ombor qiymati', value: formatCompact(invValue), icon: <Package />, to: '/warehouse', delta: `${low.length + outS.length} ta xavf`, deltaUp: low.length + outS.length === 0, perm: 'warehouse' as const },
  ].filter((k) => can(role, k.perm))

  return (
    <div className="page">
      <PageHeader
        title={`Salom, ${user?.name?.split(' ')[0] ?? 'Foydalanuvchi'} 👋`}
        sub={`${data.company.name} • bugungi biznes holati — ${formatDate(new Date().toISOString())}`}
        actions={
          <>
            <Button size="sm" onClick={() => navigate('/ai-cfo')}><Bot />AI tahlil</Button>
            {can(role, 'sales', 'create') && <Button size="sm" variant="primary" onClick={() => navigate('/sales?new=1')}><Sparkles />Yangi savdo</Button>}
          </>
        }
      />

      {/* KPI grid */}
      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="card card-hover kpi" onClick={() => navigate(k.to)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(k.to)}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <span className={`kpi-delta ${k.deltaUp ? 'up' : 'down'}`}>
              {k.deltaUp ? <ArrowUpRight /> : <ArrowDownRight />}{k.delta}
            </span>
          </div>
        ))}
      </div>

      {/* charts row */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.8fr 1fr', alignItems: 'stretch' }} id="dash-charts-row">
        <div className="card">
          <div className="row-between wrap mb-2">
            <div>
              <p className="card-title">Tushum vs Xarajat</p>
              <p className="card-sub">Oylar kesimida, so‘mda</p>
            </div>
            <div className="tabs">
              {(['6', '12'] as const).map((r) => (
                <button key={r} className={`tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r} oy</button>
              ))}
            </div>
          </div>
          <AreaChart data={series} names={['Tushum', 'Xarajat']} height={240} format={formatCompact} />
          <div className="row wrap mt-2" style={{ gap: 20 }}>
            <span className="fs-12 text-2">Oylik tushum: <b className="t-accent mono">{formatCompact(inc)}</b></span>
            <span className="fs-12 text-2">Xarajat: <b className="mono" style={{ color: 'var(--pink)' }}>{formatCompact(exp)}</b></span>
            <span className="fs-12 text-2">Sof foyda: <b className={profit >= 0 ? 't-success mono' : 't-danger mono'}>{formatCompact(profit)}</b></span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="card-title">Moliyaviy salomatlik</p>
          <p className="card-sub mb-2">AI CFO bahosi — {hs.score >= 75 ? 'barqaror' : hs.score >= 55 ? 'o‘rtacha' : 'e’tibor talab'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <ProgressRing value={hs.score} label="ball" size={148} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {hs.parts.map((p) => (
              <div key={p.label}>
                <div className="row-between fs-12" style={{ marginBottom: 4 }}>
                  <span className="text-2">{p.label}</span>
                  <span className="mono fw-6">{p.score}/{p.max}</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${(p.score / p.max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI insights */}
      <div className="card mt-3">
        <div className="row-between wrap mb-2">
          <div className="row" style={{ gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-sm)' }}>
              <Bot style={{ width: 17, height: 17, color: '#fff' }} />
            </span>
            <div>
              <p className="card-title">AI CFO — bugungi tavsialar</p>
              <p className="card-sub">Ma’lumotlar real vaqtda tahlil qilinadi</p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate('/ai-cfo')}>Barchasi <ChevronRight style={{ width: 14, height: 14 }} /></Button>
        </div>
        <div className="grid-3">
          {insights.slice(0, 6).map((ins) => (
            <div key={ins.id} className="card card-hover" style={{ background: 'var(--surface)', boxShadow: 'none', cursor: 'pointer', padding: 16 }} onClick={() => navigate(ins.action.to)}>
              <div className="row" style={{ gap: 7, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: SEV_COLORS[ins.severity], boxShadow: `0 0 8px ${SEV_COLORS[ins.severity]}` }} />
                <span className="fw-6 fs-13" style={{ flex: 1 }}>{ins.title}</span>
              </div>
              <p className="fs-12 text-2" style={{ lineHeight: 1.6, minHeight: 38 }}>{ins.message}</p>
              <span className="link-accent fs-12" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                {ins.action.label} <ChevronRight style={{ width: 12, height: 12 }} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* bottom rows */}
      <div className="grid-2 mt-3" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        {/* recent sales */}
        <div className="card" style={{ padding: 20 }}>
          <div className="row-between mb-2">
            <p className="card-title">So‘nggi savdolar</p>
            <Link to="/sales" className="link-accent fs-12">Barchasi</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentOrders.map((o) => {
              const cust = data.customers.find((c) => c.id === o.customerId)
              return (
                <Link key={o.id} to="/sales" className="row-between" style={{ padding: '10px 2px', borderBottom: '1px solid var(--border)', gap: 10 }}>
                  <div className="row" style={{ gap: 11, minWidth: 0 }}>
                    <Avatar name={cust?.name ?? 'M'} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <p className="fw-6 fs-13" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cust?.name}</p>
                      <p className="fs-11 text-3">{o.id} • {timeAgo(o.date)}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="mono fw-6 fs-13">{formatCompact(o.amount)}</p>
                    <Badge variant={o.payment === 'paid' ? 'success' : o.payment === 'partial' ? 'warning' : 'danger'}>
                      {o.payment === 'paid' ? 'To‘langan' : o.payment === 'partial' ? 'Qismiy' : 'Qarz'}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* low stock */}
        <div className="card">
          <div className="row-between mb-2">
            <p className="card-title">Ombor ogohlantirishlari</p>
            <Link to="/warehouse" className="link-accent fs-12">Ombor</Link>
          </div>
          {[...outS, ...low].slice(0, 5).map((p) => (
            <Link key={p.id} to="/warehouse" className="row-between" style={{ padding: '10px 2px', borderBottom: '1px solid var(--border)', gap: 10 }}>
              <div className="row" style={{ gap: 10, minWidth: 0 }}>
                <span style={{ width: 32, height: 32, borderRadius: 10, background: p.stock === 0 ? 'var(--danger-soft)' : 'var(--warning-soft)', color: p.stock === 0 ? 'var(--danger)' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle style={{ width: 15, height: 15 }} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <p className="fw-6 fs-13" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>{p.name}</p>
                  <p className="fs-11 text-3">{p.stock} {p.unit} / min {p.minStock}</p>
                </div>
              </div>
              <Badge variant={p.stock === 0 ? 'danger' : 'warning'}>{p.stock === 0 ? 'Tugagan' : 'Kam qold'}</Badge>
            </Link>
          ))}
          {outS.length + low.length === 0 && <p className="fs-13 text-3 center" style={{ padding: 30 }}>Barcha mahsulotlar yetarli ✨</p>}
        </div>
      </div>

      <div className="grid-2 mt-3" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        {/* profit chart */}
        <div className="card">
          <p className="card-title">Sof foyda dinamikasi</p>
          <p className="card-sub mb-2">Tushum minus xarajat, oylar kesimida</p>
          <BarChart data={profitSeries} names={['Sof foyda']} colors={['#34d399']} height={190} format={formatCompact} />
        </div>
        {/* expense breakdown */}
        <div className="card">
          <p className="card-title">Xarajat tarkibi — bu oy</p>
          <p className="card-sub mb-2">Asosiy toifalar</p>
          <DonutChart
            centerLabel="Jami" centerValue={formatCompact(exp)}
            format={(v) => formatCompact(v)}
            data={expenseBreakdown(data.transactions).slice(0, 5).map((e, i) => ({
              label: e.category, value: e.amount,
              color: ['#8b5cf6', '#c084fc', '#e879f9', '#60a5fa', '#34d399'][i],
            }))}
          />
        </div>
      </div>

      {/* recent transactions */}
      <div className="card mt-3">
        <div className="row-between mb-2">
          <p className="card-title">So‘nggi tranzaksiyalar</p>
          <Link to="/accounting" className="link-accent fs-12">Buxgalteriya</Link>
        </div>
        <div className="table-wrap has-cards">
          <table className="table">
            <thead>
              <tr><th>Sana</th><th>Tavsif</th><th>Toifa</th><th className="right">Summa</th><th>Turi</th></tr>
            </thead>
            <tbody>
              {recentTrxs.map((t) => (
                <tr key={t.id}>
                  <td className="fs-12 text-2 mono">{formatDate(t.date)}</td>
                  <td className="fs-13 fw-6" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                  <td><Badge variant="neutral">{t.category}</Badge></td>
                  <td className="right mono fw-6" style={{ color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {t.type === 'income' ? '+' : '−'}{formatCompact(t.amount)}
                  </td>
                  <td><Badge variant={t.type === 'income' ? 'success' : 'danger'}>{t.type === 'income' ? 'Daromad' : 'Xarajat'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-cards">
            {recentTrxs.map((t) => (
              <div key={t.id} className="table-card-item">
                <div className="table-card-row"><span className="table-card-label">Tavsif</span><span className="fw-6 fs-13">{t.description}</span></div>
                <div className="table-card-row"><span className="table-card-label">Toifa</span><span>{t.category}</span></div>
                <div className="table-card-row"><span className="table-card-label">Summa</span><span className="mono fw-6" style={{ color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>{formatUZS(t.amount)}</span></div>
                <div className="table-card-row"><span className="table-card-label">Sana</span><span className="fs-12 text-2 mono">{formatDate(t.date)}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 1100px) { #dash-charts-row, .grid-2[style*="1.5fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
