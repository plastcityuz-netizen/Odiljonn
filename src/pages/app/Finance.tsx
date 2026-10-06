import React, { useMemo, useState } from 'react'
import { AreaChart, BarChart, DonutChart } from '../../components/charts/Charts'
import { useData } from '../../lib/store'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/primitives'
import { formatCompact, formatUZS, MONTHS_UZ_FULL, percent } from '../../lib/utils'
import { cashFlow, expenseBreakdown, monthExpense, monthIncome, monthlySeries, prevMonthExpense, prevMonthIncome, receivables, payables, forecastMonthEnd } from '../../lib/analytics'
import { Download } from 'lucide-react'
import { useToast } from '../../components/ui/toast'
import { downloadCSV } from '../../lib/utils'

type Range = '7' | '30' | 'month' | 'prev' | 'custom'

const RANGE_LABELS: Record<Range, string> = {
  '7': '7 kun',
  '30': '30 kun',
  month: 'Bu oy',
  prev: 'O‘tgan oy',
  custom: 'Tanlangan',
}

export default function Finance() {
  const { data } = useData()
  const { toast } = useToast()
  const [range, setRange] = useState<Range>('month')
  const [from, setFrom] = useState(new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))

  const filtered = useMemo(() => {
    return data.transactions.filter((t) => {
      const d = new Date(t.date)
      if (range === '7') return Date.now() - d.getTime() <= 7 * 86400000
      if (range === '30') return Date.now() - d.getTime() <= 30 * 86400000
      if (range === 'month') return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear()
      if (range === 'prev') {
        const p = new Date()
        p.setMonth(p.getMonth() - 1)
        return d.getMonth() === p.getMonth() && d.getFullYear() === p.getFullYear()
      }
      return d >= new Date(from) && d <= new Date(to + 'T23:59:59')
    })
  }, [data.transactions, range, from, to])

  const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const profit = income - expense

  const monthly = useMemo(() => monthlySeries(data.transactions, 12), [data.transactions])
  const series = monthly.map((m) => ({ label: m.label, values: [m.income, m.expense] }))
  const profitSeries = monthly.map((m) => ({ label: m.label, values: [m.profit] }))
  const cashSeries = useMemo(() => {
    let acc = 0
    return monthly.map((m) => {
      acc += m.profit
      return { label: m.label, values: [acc] }
    })
  }, [monthly])

  const rec = receivables(data)
  const pay = payables(data)
  const inc = monthIncome(data.transactions)
  const exp = monthExpense(data.transactions)
  const now = new Date()
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const forecastInc = forecastMonthEnd(inc, now.getDate(), dim)
  const forecastExp = forecastMonthEnd(exp, now.getDate(), dim)

  return (
    <div className="page">
      <PageHeader
        title="Moliya"
        sub="Tushum, xarajat, foyda va cash flow — barcha diagrammalar umumiy ma’lumotlar bazasidan hisoblanadi."
        actions={
          <Button size="sm" onClick={() => {
            downloadCSV('moliya.csv', [['Oy', 'Tushum', 'Xarajat', 'Sof foyda'], ...monthly.map((m) => [m.label, m.income, m.expense, m.profit])])
            toast('success', 'Eksport tayyor.', 'moliya.csv yuklab olindi')
          }}><Download />Export</Button>
        }
      />

      {/* date filters */}
      <div className="card mb-3" style={{ padding: '14px 18px' }}>
        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
          <div className="tabs">
            {(['7', '30', 'month', 'prev', 'custom'] as Range[]).map((r) => (
              <button key={r} className={`tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{RANGE_LABELS[r]}</button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="row wrap" style={{ gap: 8 }}>
              <input type="date" className="input" style={{ width: 150 }} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Dan" />
              <span className="text-3">—</span>
              <input type="date" className="input" style={{ width: 150 }} value={to} onChange={(e) => setTo(e.target.value)} aria-label="Gacha" />
            </div>
          )}
          <span className="fs-12 text-3">{RANGE_LABELS[range]} davri: {filtered.length} tranzaksiya</span>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          { label: 'Tushum', value: income, delta: percent(inc, prevMonthIncome(data.transactions)), good: true },
          { label: 'Xarajat', value: expense, delta: percent(exp, prevMonthExpense(data.transactions)), good: false },
          { label: 'Sof foyda', value: profit, delta: percent(profit, prevMonthIncome(data.transactions) - prevMonthExpense(data.transactions)), good: true },
          { label: 'Cash flow (jami)', value: cashFlow(data.transactions), delta: 0, good: true },
        ].map((k) => (
          <div key={k.label} className="card kpi">
            <div className="kpi-icon">{k.label === 'Tushum' ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> : k.label === 'Xarajat' ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg> : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}</div>
            <div className="kpi-label">{k.label} — {RANGE_LABELS[range].toLowerCase()}</div>
            <div className="kpi-value">{formatCompact(k.value)}</div>
            {k.delta !== 0 && (
              <span className={`kpi-delta ${(k.delta > 0) === k.good ? 'up' : 'down'}`}>
                {k.delta > 0 ? '↑' : '↓'} {Math.abs(k.delta)}% o‘tgan oyga nisbatan
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="grid-2 mt-3" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <p className="card-title">Tushum va xarajat — 12 oy</p>
          <p className="card-sub mb-2">Barcha modullardan yig‘ilgan real ma’lumotlar</p>
          <AreaChart data={series} names={['Tushum', 'Xarajat']} height={250} format={formatCompact} />
        </div>
        <div className="card">
          <p className="card-title">Xarajat tarkibi</p>
          <p className="card-sub mb-2">Bu oy, asosiy toifalar</p>
          <DonutChart
            centerLabel="Jami" centerValue={formatCompact(exp)}
            format={(v) => formatCompact(v)}
            data={expenseBreakdown(data.transactions).slice(0, 6).map((e, i) => ({
              label: e.category, value: e.amount,
              color: ['#8b5cf6', '#c084fc', '#e879f9', '#60a5fa', '#34d399', '#fbbf24'][i],
            }))}
          />
        </div>
      </div>

      <div className="grid-2 mt-3">
        <div className="card">
          <p className="card-title">Sof foyda dinamikasi</p>
          <p className="card-sub mb-2">Oylik foyda, so‘mda</p>
          <BarChart data={profitSeries} names={['Sof foyda']} colors={['#34d399']} height={210} format={formatCompact} />
        </div>
        <div className="card">
          <p className="card-title">Cash flow (kümülatif)</p>
          <p className="card-sub mb-2">Pul aylanmasining o‘sishi</p>
          <AreaChart data={cashSeries} names={['Kümülativ balans']} colors={['#60a5fa']} height={210} format={formatCompact} />
        </div>
      </div>

      <div className="grid-2 mt-3">
        <div className="card">
          <p className="card-title mb-2">Oy prognozi — {MONTHS_UZ_FULL[now.getMonth()]}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="stat-mini">
              <span className="text-2 fs-13">Tushum prognozi</span>
              <span className="mono fw-7">{formatUZS(Math.round(forecastInc))}</span>
            </div>
            <div className="stat-mini">
              <span className="text-2 fs-13">Xarajat prognozi</span>
              <span className="mono fw-7">{formatUZS(Math.round(forecastExp))}</span>
            </div>
            <div className="stat-mini" style={{ background: forecastInc - forecastExp >= 0 ? 'var(--success-soft)' : 'var(--danger-soft)' }}>
              <span className="text-2 fs-13">Sof foyda prognozi</span>
              <span className={`mono fw-7 ${forecastInc - forecastExp >= 0 ? 't-success' : 't-danger'}`}>{formatUZS(Math.round(forecastInc - forecastExp))}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <p className="card-title mb-2">Debitor va kreditor</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="stat-mini">
              <span className="text-2 fs-13">Debitorlar (sizga qarz)</span>
              <span className="mono fw-7 t-danger">{formatUZS(rec.reduce((s, r) => s + r.remaining, 0))}</span>
            </div>
            <div className="stat-mini">
              <span className="text-2 fs-13">Kreditorlar (sizning qarzingiz)</span>
              <span className="mono fw-7 t-warning">{formatUZS(pay.reduce((s, p) => s + p.purchase.amount, 0))}</span>
            </div>
            <div className="stat-mini">
              <span className="text-2 fs-13">To‘lov kutilayotgan buyurtmalar</span>
              <span className="fw-7">{rec.length} ta</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 1100px) { .grid-2[style*="1.6fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
