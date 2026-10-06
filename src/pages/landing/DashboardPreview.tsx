import React from 'react'
import { ArrowDownRight, ArrowUpRight, Bot, Package, ShoppingCart, Wallet, Boxes, Receipt } from 'lucide-react'
import { AreaChart, DonutChart } from '../../components/charts/Charts'
import { useData } from '../../lib/store'
import { formatCompact, formatUZS } from '../../lib/utils'
import { monthlySeries, todaySales, monthIncome, monthExpense, cashFlow, receivables, inventoryValue, lowStockProducts } from '../../lib/analytics'

// Real product UI — rendered from live shared store data
export function DashboardPreview() {
  const { data } = useData()
  const series = monthlySeries(data.transactions, 8).map((m) => ({ label: m.label, values: [m.income, m.expense] }))
  const inc = monthIncome(data.transactions)
  const exp = monthExpense(data.transactions)
  const profit = inc - exp
  const rec = receivables(data)
  const low = lowStockProducts(data.products).length
  const topProducts = [...data.orders.flatMap((o) => o.items)]
    .reduce<{ name: string; qty: number }[]>((acc, it) => {
      const p = data.products.find((x) => x.id === it.productId)
      if (!p) return acc
      const e = acc.find((a) => a.name === p.name)
      if (e) e.qty += it.qty
      else acc.push({ name: p.name, qty: it.qty })
      return acc
    }, [])
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4)

  return (
    <div className="mockup-frame float-anim" style={{ transformStyle: 'preserve-3d' }}>
      {/* window chrome */}
      <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: 99, background: '#ff5f57' }} />
        <span style={{ width: 9, height: 9, borderRadius: 99, background: '#febc2e' }} />
        <span style={{ width: 9, height: 9, borderRadius: 99, background: '#28c840' }} />
        <span className="fs-11 text-3" style={{ margin: '0 auto', background: 'var(--surface)', padding: '3px 14px', borderRadius: 99, border: '1px solid var(--border)' }}>
          app.balans.ai/dashboard
        </span>
      </div>

      <div className="row" style={{ alignItems: 'stretch' }}>
        {/* mini sidebar */}
        <div style={{ width: 176, borderRight: '1px solid var(--border)', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 3 }} className="pv-side">
          <div className="row" style={{ gap: 8, padding: '2px 8px 12px' }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>B</span>
            <span className="fw-7 fs-12">BALANS AI</span>
          </div>
          {[
            ['Dashboard', true], ['AI CFO', false], ['Savdo', false], ['Mijozlar', false],
            ['Ombor', false], ['Xaridlar', false], ['Ishlab chiqarish', false], ['Buxgalteriya', false],
            ['Moliya', false], ['Qarzdorlik', false], ['HR', false], ['Hisobotlar', false],
          ].map(([label, active]) => (
            <div key={label as string} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5.5px 9px', borderRadius: 8, fontSize: 11,
              color: active ? 'var(--text)' : 'var(--text-3)', fontWeight: (active as boolean) ? 600 : 500,
              background: active ? 'linear-gradient(90deg, rgba(139,92,246,.22), rgba(232,121,249,.08))' : 'transparent',
              border: (active as boolean) ? '1px solid rgba(139,92,246,.3)' : '1px solid transparent',
            }}>
              <span style={{ width: 13, height: 4, borderRadius: 4, background: active ? 'var(--grad)' : 'var(--surface-3)' }} />
              {label as string}
            </div>
          ))}
        </div>

        {/* content */}
        <div style={{ flex: 1, padding: '16px 18px', minWidth: 0, background: 'linear-gradient(180deg, rgba(139,92,246,.035), transparent 30%)' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p className="fw-7 font-display" style={{ fontSize: 15 }}>Salom, Odiljon 👋</p>
              <p className="fs-11 text-3">Osiyo Savdo MChJ • bugungi holat</p>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span className="badge badge-accent" style={{ fontSize: 10 }}><Bot style={{ width: 10, height: 10 }} />AI CFO tayyor</span>
              <span className="badge badge-success" style={{ fontSize: 10 }}>Onlayn</span>
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }} className="pv-kpis">
            {[
              { label: 'Bugungi savdo', value: formatCompact(todaySales(data.orders)), delta: '+12.4%', up: true, icon: <ShoppingCart style={{ width: 12, height: 12 }} /> },
              { label: 'Oylik tushum', value: formatCompact(inc), delta: '+8.1%', up: true, icon: <Wallet style={{ width: 12, height: 12 }} /> },
              { label: 'Sof foyda', value: formatCompact(profit), delta: profit > 0 ? '+5.6%' : '−2.3%', up: profit > 0, icon: <ArrowUpRight style={{ width: 12, height: 12 }} /> },
              { label: 'Cash flow', value: formatCompact(cashFlow(data.transactions)), delta: 'barqaror', up: true, icon: <Boxes style={{ width: 12, height: 12 }} /> },
            ].map((k) => (
              <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
                <div className="row" style={{ gap: 6, color: 'var(--text-3)', fontSize: 10, fontWeight: 600 }}>{k.icon}{k.label}</div>
                <p className="font-display fw-7 mono" style={{ fontSize: 16, marginTop: 5 }}>{k.value}</p>
                <p className={`fs-10 fw-6 ${k.up ? 't-success' : 't-danger'}`} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {k.up ? <ArrowUpRight style={{ width: 10, height: 10 }} /> : <ArrowDownRight style={{ width: 10, height: 10 }} />}{k.delta}
                </p>
              </div>
            ))}
          </div>

          {/* charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.9fr 1fr', gap: 10 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px 4px', minWidth: 0 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 2 }}>
                <p className="fw-6 fs-11">Tushum vs Xarajat</p>
                <div className="chart-legend" style={{ fontSize: 9.5, gap: 10 }}>
                  <span className="cl-item"><span className="cl-dot" style={{ background: '#8b5cf6' }} />Tushum</span>
                  <span className="cl-item"><span className="cl-dot" style={{ background: '#e879f9' }} />Xarajat</span>
                </div>
              </div>
              <AreaChart data={series} names={['Tushum', 'Xarajat']} height={148} format={(v) => formatCompact(v)} />
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', minWidth: 0 }}>
              <p className="fw-6 fs-11" style={{ marginBottom: 4 }}>Ombor qiymati</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <DonutChart
                  size={112} thickness={15}
                  centerLabel="Jami" centerValue={`${formatCompact(inventoryValue(data.products))}`}
                  format={(v) => formatCompact(v)}
                  data={[
                    { label: 'Tayyor mahsulot', value: data.products.filter((p) => p.type === 'finished').reduce((s, p) => s + p.stock * p.costPrice, 0), color: '#8b5cf6' },
                    { label: 'Xomashyo', value: data.products.filter((p) => p.type === 'raw').reduce((s, p) => s + p.stock * p.costPrice, 0), color: '#e879f9' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* bottom row: AI insight + activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.9fr 1fr', gap: 10, marginTop: 10 }}>
            <div style={{
              background: 'linear-gradient(120deg, rgba(139,92,246,.14), rgba(232,121,249,.06))',
              border: '1px solid rgba(139,92,246,.32)', borderRadius: 12, padding: '11px 13px',
            }}>
              <div className="row" style={{ gap: 7, marginBottom: 5 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot style={{ width: 12, height: 12, color: '#fff' }} /></span>
                <p className="fw-6 fs-11">AI CFO — bugungi tavsia</p>
                <span className="badge badge-warning" style={{ fontSize: 9, marginLeft: 'auto' }}>Muammo</span>
              </div>
              <p className="fs-11" style={{ lineHeight: 1.6, color: 'var(--text-2)' }}>
                <b className="t-accent">MUAMMO:</b> Foyda marjasi 2.1% pasaydi. <b className="t-accent">SABAB:</b> xomashyo xarajatlari oshdi.
                <b className="t-accent"> TA’SIR:</b> oy yakunida foyda 8.2% kamayishi mumkin. <b className="t-accent">TAVSIYA:</b> 3 ta yetkazib beruvchi narxini solishtiring.
              </p>
              <div className="row" style={{ gap: 6, marginTop: 8 }}>
                <span className="btn btn-primary btn-sm" style={{ fontSize: 10, padding: '4px 10px' }}>Yetkazib beruvchilarni ko‘rish</span>
                <span className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '4px 10px' }}>Batafsil tahlil</span>
              </div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 13px' }}>
              <p className="fw-6 fs-11" style={{ marginBottom: 8 }}>So‘nggi harakatlar</p>
              {[
                { icon: <ShoppingCart style={{ width: 10, height: 10 }} />, text: `${data.orders[0]?.id ?? 'S-1001'} — yangi buyurtma`, sub: formatUZS(data.orders[0]?.amount ?? 0), color: 'var(--success)' },
                { icon: <Package style={{ width: 10, height: 10 }} />, text: `${low} ta mahsulot tugayapti`, sub: 'Ombor', color: 'var(--warning)' },
                { icon: <Receipt style={{ width: 10, height: 10 }} />, text: `${rec.length} ta kutilayotgan to‘lov`, sub: 'Qarzdorlik', color: 'var(--danger)' },
              ].map((a, i) => (
                <div key={i} className="row" style={{ gap: 8, padding: '5px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--surface-2)', color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.icon}</span>
                  <span style={{ minWidth: 0 }}>
                    <span className="fs-10 fw-6" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</span>
                    <span className="fs-9 text-3" style={{ fontSize: 9 }}>{a.sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* top products strip */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflow: 'hidden' }}>
            {topProducts.map((p) => (
              <div key={p.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99, padding: '4px 12px', fontSize: 10, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{p.name.split(',')[0]}</span> • {p.qty} dona
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) { .pv-side { display: none; } }
        @media (max-width: 640px) { .pv-kpis { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </div>
  )
}
