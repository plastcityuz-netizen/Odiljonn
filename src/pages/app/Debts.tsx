import React, { useMemo, useState } from 'react'
import { AlertCircle, Bell, Clock, Download, HandCoins, Receipt } from 'lucide-react'
import { useData } from '../../lib/store'
import { usePerm } from '../../components/layout/Guarded'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button } from '../../components/ui/primitives'
import { ConfirmDialog, Drawer, Modal } from '../../components/ui/modals'
import { DataTable, FilterChips, type Column } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/toast'
import { downloadCSV, formatCompact, formatDate, formatUZS } from '../../lib/utils'
import { payables, receivables } from '../../lib/analytics'

export default function Debts() {
  const { data, dispatch } = useData()
  const perm = usePerm()
  const { toast } = useToast()

  const [tab, setTab] = useState<'receivables' | 'payables'>('receivables')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState<any>(null)
  const [remind, setRemind] = useState<any>(null)
  const [payOpen, setPayOpen] = useState<any>(null)
  const [payAmount, setPayAmount] = useState('')

  const rec = useMemo(() => receivables(data), [data])
  const pay = useMemo(() => payables(data), [data])

  const recOverdue = rec.filter((r) => r.overdue)
  const recDueSoon = rec.filter((r) => !r.overdue && r.daysLate > -7)
  const payOverdue = pay.filter((p) => p.overdue)

  const recRows = useMemo(() => {
    let list = [...rec]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((r) => r.customerName.toLowerCase().includes(s) || r.order.id.toLowerCase().includes(s))
    }
    if (filter === 'overdue') list = list.filter((r) => r.overdue)
    if (filter === 'soon') list = list.filter((r) => !r.overdue && r.daysLate > -7)
    return list
  }, [rec, search, filter])

  const recColumns: Column<typeof rec[number]>[] = [
    {
      key: 'customer', header: 'Mijoz', sortValue: (r) => r.customerName,
      render: (r) => (<div><p className="fw-6 fs-13">{r.customerName}</p><p className="fs-11 text-3">{data.customers.find((c) => c.name === r.customerName)?.phone}</p></div>),
    },
    { key: 'invoice', header: 'Buyurtma', sortValue: (r) => r.order.id, render: (r) => <span className="mono fs-12 fw-6">{r.order.id}</span> },
    { key: 'amount', header: 'Qolgan qarz', align: 'right', sortValue: (r) => r.remaining, render: (r) => <span className="mono fw-6 fs-13 t-danger">{formatCompact(r.remaining)}</span> },
    { key: 'due', header: 'Muddat', sortValue: (r) => r.dueDate, render: (r) => <span className="fs-12 mono text-2">{formatDate(r.dueDate)}</span> },
    {
      key: 'late', header: 'Kechikish', align: 'right', sortValue: (r) => r.daysLate,
      render: (r) => r.daysLate > 0
        ? <Badge variant="danger">{r.daysLate} kun o‘tdi</Badge>
        : <Badge variant="success">{-r.daysLate} kun qoldi</Badge>,
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) => (
        <div className="row-actions">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setRemind(r) }} aria-label="Eslatma"><Bell /></Button>
          <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); setPayOpen(r); setPayAmount(String(r.remaining)) }}>To‘lov</Button>
        </div>
      ),
    },
  ]

  const payColumns: Column<typeof pay[number]>[] = [
    {
      key: 'supplier', header: 'Yetkazib beruvchi', sortValue: (p) => p.supplierName,
      render: (p) => <div><p className="fw-6 fs-13">{p.supplierName}</p><p className="fs-11 text-3">{data.suppliers.find((s) => s.name === p.supplierName)?.phone}</p></div>,
    },
    { key: 'purchase', header: 'Xarid', sortValue: (p) => p.purchase.id, render: (p) => <span className="mono fs-12 fw-6">{p.purchase.id}</span> },
    { key: 'amount', header: 'Summa', align: 'right', sortValue: (p) => p.purchase.amount, render: (p) => <span className="mono fw-6 fs-13 t-warning">{formatCompact(p.purchase.amount)}</span> },
    { key: 'status', header: 'Holat', render: (p) => <Badge variant={p.purchase.status === 'received' ? 'accent' : 'info'}>{p.purchase.status === 'received' ? 'Qabul qilingan' : p.purchase.status === 'approved' ? 'Tasdiqlangan' : 'Kutilmoqda'}</Badge> },
    {
      key: 'actions', header: '', align: 'right',
      render: (p) => (
        <div className="row-actions">
          <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_PURCHASE_STATUS', id: p.purchase.id, status: 'paid' }); toast('success', 'To‘lov amalga oshirildi.', `${p.purchase.id} — xarajat sifatida yozildi`) }}>To‘lash</Button>
        </div>
      ),
    },
  ]

  const totalRec = rec.reduce((s, r) => s + r.remaining, 0)
  const totalPay = pay.reduce((s, p) => s + p.purchase.amount, 0)

  return (
    <div className="page">
      <PageHeader
        title="Qarzdorlik"
        sub="Debitor va kreditor qarzlari. To‘lovlar cash flow va buyurtma holatini avtomatik yangilaydi."
        actions={
          <Button size="sm" onClick={() => {
            downloadCSV('qarzdorlik.csv', [['Mijoz', 'Buyurtma', 'Qolgan qarz', 'Muddat', 'Kechikish (kun)'], ...rec.map((r) => [r.customerName, r.order.id, r.remaining, formatDate(r.dueDate), r.daysLate])])
            toast('success', 'Eksport tayyor.', 'qarzdorlik.csv yuklab olindi')
          }}><Download />Export</Button>
        }
      />

      <div className="kpi-grid">
        {[
          { label: 'Jami qarz (sizga)', value: formatCompact(totalRec), sub: `${rec.length} ta buyurtma`, cls: '' },
          { label: 'Muddati o‘tgan', value: formatCompact(recOverdue.reduce((s, r) => s + r.remaining, 0)), sub: `${recOverdue.length} ta debitor`, cls: 'danger' },
          { label: 'Yaqin muddat', value: formatCompact(recDueSoon.reduce((s, r) => s + r.remaining, 0)), sub: '7 kun ichida', cls: 'warning' },
          { label: 'Sizning qarzingiz', value: formatCompact(totalPay), sub: `${pay.length} ta yetkazib beruvchi`, cls: 'info' },
        ].map((k) => (
          <div key={k.label} className="card kpi">
            <div className="kpi-icon" style={k.cls === 'danger' ? { background: 'var(--danger-soft)', color: 'var(--danger)' } : k.cls === 'warning' ? { background: 'var(--warning-soft)', color: 'var(--warning)' } : k.cls === 'info' ? { background: 'var(--info-soft)', color: 'var(--info)' } : undefined}>
              {k.cls === 'danger' ? <AlertCircle /> : k.cls === 'warning' ? <Clock /> : <Receipt />}
            </div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <span className={`kpi-delta ${k.cls === 'danger' ? 'down' : 'up'}`}>{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row-between wrap mb-2" style={{ marginBottom: 16 }}>
          <div className="tabs">
            <button className={`tab ${tab === 'receivables' ? 'active' : ''}`} onClick={() => setTab('receivables')}><HandCoins />Debitorlar ({rec.length})</button>
            <button className={`tab ${tab === 'payables' ? 'active' : ''}`} onClick={() => setTab('payables')}><Receipt />Kreditorlar ({pay.length})</button>
          </div>
          {tab === 'receivables' && (
            <FilterChips value={filter} onChange={setFilter} options={[
              { key: 'all', label: 'Barchasi' }, { key: 'overdue', label: `Muddati o‘tgan (${recOverdue.length})` }, { key: 'soon', label: 'Yaqin muddat' },
            ]} />
          )}
        </div>

        {tab === 'receivables' ? (
          <DataTable
            columns={recColumns}
            rows={recRows}
            rowKey={(r) => r.order.id}
            searchValue={search}
            onSearch={setSearch}
            searchPlaceholder="Mijoz yoki buyurtma ID..."
            onRowClick={(r) => setDetail(r)}
            mobileTitle={(r) => r.customerName}
            mobileSubtitle={(r) => `${r.order.id} • ${formatCompact(r.remaining)}`}
            placeholder={{ title: 'Debitor qarzlar yo‘q', text: 'Barcha buyurtmalar to‘langan — ajoyib!', icon: <HandCoins /> }}
          />
        ) : (
          <DataTable
            columns={payColumns}
            rows={pay}
            rowKey={(p) => p.purchase.id}
            mobileTitle={(p) => p.supplierName}
            mobileSubtitle={(p) => `${p.purchase.id} • ${formatCompact(p.purchase.amount)}`}
            placeholder={{ title: 'Kreditor qarzlar yo‘q', text: 'Barcha xaridlar to‘langan.', icon: <Receipt /> }}
          />
        )}
      </div>

      {/* reminder modal */}
      <Modal
        open={!!remind} onClose={() => setRemind(null)}
        title="To‘lov eslatmasi yuborish"
        footer={
          <>
            <Button onClick={() => setRemind(null)}>Bekor qilish</Button>
            <Button variant="primary" onClick={() => {
              dispatch({
                type: 'NOTIF_ADD',
                notif: { type: 'debt', title: 'Eslatma yuborildi', message: `${remind.customerName} ga ${remind.order.id} bo‘yicha eslatma yuborildi (${formatCompact(remind.remaining)} so‘m).` },
              })
              toast('success', 'Eslatma yuborildi.', `${remind.customerName} — SMS va email orqali`)
              setRemind(null)
            }}>Yuborish</Button>
          </>
        }
      >
        {remind && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="stat-mini"><span className="text-2 fs-13">Mijoz</span><span className="fw-6 fs-13">{remind.customerName}</span></div>
            <div className="stat-mini"><span className="text-2 fs-13">Qarz</span><span className="mono fw-6 t-danger">{formatUZS(remind.remaining)}</span></div>
            <div className="stat-mini"><span className="text-2 fs-13">Kechikish</span><span className="fw-6 t-danger">{remind.daysLate > 0 ? `${remind.daysLate} kun` : 'Muddat hali o‘tmagan'}</span></div>
            <div className="card" style={{ background: 'var(--surface)', padding: 14 }}>
              <p className="fs-12" style={{ lineHeight: 1.7 }}>
                Hurmatli {remind.customerName}, {remind.order.id} buyurtmasi bo‘yicha {formatUZS(remind.remaining)} qarz
                {remind.daysLate > 0 ? ` muddati ${remind.daysLate} kun o‘tgan` : ''}. Iltimos, to‘lovni amalga oshiring.
                <br /><span className="text-3">— {data.company.name}, BALANS AI orqali</span>
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* payment modal */}
      <Modal
        open={!!payOpen} onClose={() => setPayOpen(null)}
        title="Qarz to‘lovini qabul qilish"
        subtitle={payOpen ? `${payOpen.customerName} — ${payOpen.order.id}` : ''}
        footer={
          <>
            <Button onClick={() => setPayOpen(null)}>Bekor qilish</Button>
            <Button variant="primary" onClick={() => {
              const amt = Math.min(Number(payAmount) || 0, payOpen.remaining)
              if (amt <= 0) return
              dispatch({ type: 'ADD_PAYMENT', orderId: payOpen.order.id, amount: amt })
              toast('success', 'To‘lov qabul qilindi.', `${formatUZS(amt)} — cash flow va qarz yangilandi`)
              setPayOpen(null)
            }}>Qabul qilish</Button>
          </>
        }
      >
        {payOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="stat-mini"><span className="text-2 fs-13">Qolgan qarz</span><span className="mono fw-6 t-danger">{formatUZS(payOpen.remaining)}</span></div>
            <div className="field">
              <label>To‘lanayotgan summa (so‘m)</label>
              <input className="input" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div className="stat-mini" style={{ background: 'var(--success-soft)' }}>
              <span className="text-2 fs-13">Yangi qolgan qarz</span>
              <span className="mono fw-6 t-success">{formatUZS(Math.max(0, payOpen.remaining - (Number(payAmount) || 0)))}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* detail */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.customerName ?? ''} subtitle={detail ? `Buyurtma ${detail.order.id}` : ''}>
        {detail && (
          <>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Buyurtma summasi</span><span className="mono fw-6">{formatUZS(detail.order.amount)}</span></div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">To‘langan</span><span className="mono fw-6 t-success">{formatUZS(detail.order.paidAmount)}</span></div>
            <div className="stat-mini mb-2" style={{ border: '1px solid rgba(248,113,113,.35)' }}><span className="text-2 fs-13">Qolgan</span><span className="mono fw-6 t-danger">{formatUZS(detail.remaining)}</span></div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Muddat</span><span className="mono fs-13">{formatDate(detail.dueDate)}</span></div>
            <div className="stat-mini mb-2">
              <span className="text-2 fs-13">Holat</span>
              {detail.daysLate > 0 ? <Badge variant="danger">{detail.daysLate} kun kechikdi</Badge> : <Badge variant="success">Muddat ichida</Badge>}
            </div>
            <p className="card-title mt-3 mb-2">Pozitsiyalar</p>
            {detail.order.items.map((it: any, i: number) => {
              const p = data.products.find((x) => x.id === it.productId)
              return (
                <div key={i} className="stat-mini mb-1">
                  <div><p className="fw-6 fs-12">{p?.name}</p><p className="fs-11 text-3">{it.qty} × {formatCompact(it.price)}</p></div>
                  <span className="mono fs-13 fw-6">{formatCompact(it.qty * it.price)}</span>
                </div>
              )
            })}
          </>
        )}
      </Drawer>
    </div>
  )
}
