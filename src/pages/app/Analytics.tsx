import React, { useMemo, useState } from 'react'
import { BarChart3, Download, LineChart as LineChartIcon, PieChart, TrendingUp, Users } from 'lucide-react'
import { useData } from '../../lib/store'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button } from '../../components/ui/primitives'
import { AreaChart, BarChart, DonutChart, Sparkline } from '../../components/charts/Charts'
import { useToast } from '../../components/ui/toast'
import { downloadCSV, formatCompact } from '../../lib/utils'
import { expenseBreakdown, monthlySeries, productSales } from '../../lib/analytics'

const PRODUCT_COLORS = ['#8b5cf6', '#c084fc', '#e879f9', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a3e635']

export default function Analytics() {
  const { data } = useData()
  const { toast } = useToast()
  const [range, setRange] = useState('12')

  const monthly = useMemo(() => monthlySeries(data.transactions, parseInt(range)), [data.transactions, range])
  const sales = useMemo(() => productSales(data).filter((s) => s.qty > 0), [data])
  const expenses = useMemo(() => expenseBreakdown(data.transactions, false), [data.transactions])

  const revenueSeries = monthly.map((m) => ({ label: m.label, values: [m.income] }))
  const marginSeries = monthly.map((m) => ({ label: m.label, values: [m.income > 0 ? (m.profit / m.income) * 100 : 0] }))

  // category analytics
  const categories = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of sales) map.set(s.product.category, (map.get(s.product.category) ?? 0) + s.revenue)
    return [...map.entries()].map(([label, value], i) => ({ label, value, color: PRODUCT_COLORS[i % PRODUCT_COLORS.length] })).sort((a, b) => b.value - a.value)
  }, [sales])

  // customer analytics
  const topCustomers = useMemo(() => {
    return data.customers
      .map((c) => {
        const orders = data.orders.filter((o) => o.customerId === c.id)
        return {
          customer: c,
          count: orders.length,
          total: orders.reduce((s, o) => s + o.amount, 0),
          debt: orders.reduce((s, o) => s + (o.amount - o.paidAmount), 0),
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [data])

  const totalRevenue = sales.reduce((s, x) => s + x.revenue, 0)

  return (
    <div className="page">
      <PageHeader
        title="Analitika"
        sub="Biznes intellekt — savdo, marja, xarajat, mijozlar va ombor tahlili bitta joyda."
        actions={
          <Button size="sm" onClick={() => {
            downloadCSV('analitika-mahsulotlar.csv', [['Mahsulot', 'Sotilgan', 'Tushum', 'Foyda', 'Marja %'], ...sales.map((s) => [s.product.name, s.qty, s.revenue, s.profit, Math.round(s.margin * 100)])])
            toast('success', 'Eksport tayyor.', 'analitika-mahsulotlar.csv')
          }}><Download />Export</Button>
        }
      />

      <div className="card mb-3" style={{ padding: '14px 18px' }}>
        <div className="tabs">
          {['6', '12'].map((r) => (
            <button key={r} className={`tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r} oy</button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <p className="card-title"><TrendingUp style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />Tushum dinamikasi</p>
          <p className="card-sub mb-2">Oylar kesimida</p>
          <AreaChart data={revenueSeries} names={['Tushum']} colors={['#8b5cf6']} height={210} format={formatCompact} />
        </div>
        <div className="card">
          <p className="card-title"><LineChartIcon style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />Marja dinamikasi</p>
          <p className="card-sub mb-2">Sof foyda ulushi, %</p>
          <AreaChart data={marginSeries} names={['Marja %']} colors={['#34d399']} height={210} format={(v) => `${v.toFixed(1)}%`} />
        </div>
      </div>

      <div className="grid-2 mt-3">
        <div className="card">
          <p className="card-title">Mahsulotlar kesimida savdo</p>
          <p className="card-sub mb-2">Top mahsulotlar, tushum</p>
          <BarChart
            horizontal
            data={sales.slice(0, 6).map((s) => ({ label: s.product.name.split(',')[0].slice(0, 22), values: [s.revenue] }))}
            names={['Tushum']}
            colors={['#8b5cf6']}
            format={formatCompact}
          />
        </div>
        <div className="card">
          <p className="card-title"><PieChart style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />Toifalar kesimida</p>
          <p className="card-sub mb-2">Savdo tarkibi</p>
          <DonutChart
            centerLabel="Jami" centerValue={formatCompact(totalRevenue)}
            format={(v) => formatCompact(v)}
            data={categories.slice(0, 6)}
          />
        </div>
      </div>

      <div className="grid-2 mt-3">
        <div className="card">
          <p className="card-title">Xarajat tarkibi — yillik</p>
          <p className="card-sub mb-2">Barcha davrlar kesimida</p>
          <BarChart
            horizontal
            data={expenses.slice(0, 7).map((e) => ({ label: e.category, values: [e.amount] }))}
            names={['Xarajat']}
            colors={['#e879f9']}
            format={formatCompact}
          />
        </div>
        <div className="card">
          <p className="card-title"><Users style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />Mijozlar analitikasi</p>
          <p className="card-sub mb-2">Eng faol mijozlar</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {topCustomers.map((c) => (
              <div key={c.customer.id} className="stat-mini">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="fw-6 fs-13" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.customer.name}</p>
                  <p className="fs-11 text-3">{c.count} buyurtma{c.debt > 0 ? ` • qarz: ${formatCompact(c.debt)}` : ''}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="mono fw-6 fs-13">{formatCompact(c.total)}</p>
                  <Sparkline values={[3, 6, 4, 8, 5, 9, 7].map((x) => x * c.total / 1000)} width={64} height={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* product table with margin */}
      <div className="card mt-3">
        <p className="card-title mb-2"><BarChart3 style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />Mahsulot rentabelligi</p>
        <div className="table-wrap has-cards">
          <table className="table">
            <thead><tr><th>Mahsulot</th><th className="right">Sotilgan</th><th className="right">Tushum</th><th className="right">Foyda</th><th className="right">Marja</th><th>Trend</th></tr></thead>
            <tbody>
              {sales.map((s, i) => (
                <tr key={s.product.id}>
                  <td>
                    <span className="fw-6 fs-13">{s.product.name}</span>
                    <p className="fs-11 text-3">{s.product.category}</p>
                  </td>
                  <td className="right mono">{s.qty}</td>
                  <td className="right mono">{formatCompact(s.revenue)}</td>
                  <td className="right mono t-success">{formatCompact(s.profit)}</td>
                  <td className="right">
                    <Badge variant={s.margin >= 0.35 ? 'success' : s.margin >= 0.2 ? 'warning' : 'danger'}>{Math.round(s.margin * 100)}%</Badge>
                  </td>
                  <td><Sparkline values={[2, 4, 3, 6, 5, 8, 7 + (i % 3)].map((x) => x * 10)} width={70} height={20} color={s.margin >= 0.3 ? '#34d399' : '#fbbf24'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-cards">
            {sales.map((s) => (
              <div key={s.product.id} className="table-card-item">
                <div className="table-card-row"><span className="table-card-label">Mahsulot</span><span className="fw-6 fs-13">{s.product.name}</span></div>
                <div className="table-card-row"><span className="table-card-label">Tushum / foyda</span><span className="mono">{formatCompact(s.revenue)} / {formatCompact(s.profit)}</span></div>
                <div className="table-card-row"><span className="table-card-label">Marja</span><span>{Math.round(s.margin * 100)}%</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
