import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Eye, Pencil, Plus, ShoppingCart, Trash2, Download, Filter, X,
} from 'lucide-react'
import { useData } from '../../lib/store'
import { useAuth } from '../../lib/auth'
import { usePerm } from '../../components/layout/Guarded'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Field, Input, Select } from '../../components/ui/primitives'
import { ConfirmDialog, Drawer, Modal } from '../../components/ui/modals'
import { DataTable, FilterChips, type Column } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/toast'
import { downloadCSV, formatCompact, formatUZS, timeAgo } from '../../lib/utils'
import { customerStats } from '../../lib/analytics'
import type { Order } from '../../lib/types'

const PAYMENT_LABEL = { paid: 'To‘langan', partial: 'Qismiy', unpaid: 'To‘lanmagan' } as const
const PAYMENT_VARIANT = { paid: 'success', partial: 'warning', unpaid: 'danger' } as const

interface CartItem { productId: string; qty: number; price: number }

export default function Sales() {
  const { data, dispatch } = useData()
  const { user } = useAuth()
  const perm = usePerm()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detail, setDetail] = useState<Order | null>(params.get('id') ? data.orders.find((o) => o.id === params.get('id')) ?? null : null)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState<Order | null>(null)
  const [formOpen, setFormOpen] = useState(params.get('new') === '1')
  const [saving, setSaving] = useState(false)

  // form state
  const [customerId, setCustomerId] = useState(data.customers[0]?.id ?? '')
  const [items, setItems] = useState<CartItem[]>([])
  const [payment, setPayment] = useState<'paid' | 'partial' | 'unpaid'>('paid')
  const [paidAmount, setPaidAmount] = useState('')
  const [formError, setFormError] = useState('')

  // stats
  const completed = data.orders.filter((o) => o.status !== 'cancelled')
  const totalSales = completed.reduce((s, o) => s + o.amount, 0)
  const revenue = completed.reduce((s, o) => s + o.paidAmount, 0)
  const avgOrder = completed.length ? Math.round(totalSales / completed.length) : 0

  const rows = useMemo(() => {
    let list = [...data.orders]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((o) => {
        const cust = data.customers.find((c) => c.id === o.customerId)
        return o.id.toLowerCase().includes(s) || (cust?.name.toLowerCase().includes(s) ?? false)
      })
    }
    if (statusFilter !== 'all') list = list.filter((o) => o.payment === statusFilter)
    return list
  }, [data.orders, data.customers, search, statusFilter])

  const openNew = () => {
    setEditOrder(null)
    setCustomerId(data.customers[0]?.id ?? '')
    setItems([])
    setPayment('paid')
    setPaidAmount('')
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (o: Order) => {
    setEditOrder(o)
    setCustomerId(o.customerId)
    setItems(o.items.map((it) => ({ ...it })))
    setPayment(o.payment)
    setPaidAmount(String(o.paidAmount))
    setFormError('')
    setFormOpen(true)
  }

  const total = items.reduce((s, it) => s + it.qty * it.price, 0)
  const effectivePaid = payment === 'paid' ? total : payment === 'partial' ? Math.min(total, Number(paidAmount) || 0) : 0

  const addItem = () => {
    const p = data.products.find((x) => x.type === 'finished')
    if (p) setItems((arr) => [...arr, { productId: p.id, qty: 1, price: p.salePrice }])
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) return setFormError('Mijozni tanlang.')
    if (!items.length) return setFormError('Kamida bitta mahsulot qo‘shing.')
    if (items.some((it) => it.qty < 1)) return setFormError('Miqdor 1 dan katta bo‘lishi kerak.')
    if (payment === 'partial' && effectivePaid <= 0) return setFormError('Qismiy to‘lov summasini kiriting.')
    setSaving(true)
    setTimeout(() => {
      if (editOrder) {
        dispatch({ type: 'UPDATE_ORDER', order: { ...editOrder, customerId, items, amount: total, paidAmount: effectivePaid, payment } })
        toast('success', 'Buyurtma yangilandi.', `${editOrder.id} — ${formatUZS(total)}`)
      } else {
        dispatch({ type: 'ADD_ORDER', order: { customerId, items, amount: total, paidAmount: effectivePaid, payment } })
        toast('success', 'Yangi savdo yaratildi.', `Summa: ${formatUZS(total)} • ${PAYMENT_LABEL[payment]}`)
      }
      setSaving(false)
      setFormOpen(false)
    }, 650)
  }

  const columns: Column<Order>[] = [
    {
      key: 'id', header: 'Buyurtma', sortValue: (o) => o.id,
      render: (o) => (<div><p className="fw-6 fs-13 mono">{o.id}</p><p className="fs-11 text-3">{timeAgo(o.date)}</p></div>),
    },
    {
      key: 'customer', header: 'Mijoz', sortValue: (o) => data.customers.find((c) => c.id === o.customerId)?.name ?? '',
      render: (o) => {
        const c = data.customers.find((x) => x.id === o.customerId)
        return (<div><p className="fw-6 fs-13">{c?.name ?? '—'}</p><p className="fs-11 text-3">{c?.phone}</p></div>)
      },
    },
    {
      key: 'items', header: 'Mahsulot',
      render: (o) => {
        const names = o.items.map((it) => data.products.find((p) => p.id === it.productId)?.name ?? '—')
        return <span className="fs-12 text-2" style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{names.join(', ')}</span>
      },
      mobileRender: (o) => <span className="fs-12 text-2">{o.items.length} ta pozitsiya</span>,
    },
    { key: 'amount', header: 'Summa', align: 'right', sortValue: (o) => o.amount, render: (o) => <span className="mono fw-6 fs-13">{formatUZS(o.amount)}</span> },
    { key: 'payment', header: 'To‘lov', sortValue: (o) => o.payment, render: (o) => <Badge variant={PAYMENT_VARIANT[o.payment]}>{PAYMENT_LABEL[o.payment]}</Badge> },
    {
      key: 'actions', header: '', align: 'right',
      render: (o) => (
        <div className="row-actions">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(o) }} aria-label="Ko‘rish"><Eye /></Button>
          {perm.can('sales', 'edit') && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(o) }} aria-label="Tahrirlash"><Pencil /></Button>}
          {perm.can('sales', 'delete') && <Button size="sm" variant="ghost" className="t-danger" onClick={(e) => { e.stopPropagation(); setDeleting(o) }} aria-label="O‘chirish"><Trash2 /></Button>}
        </div>
      ),
    },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Savdo"
        sub="Buyurtmalar, to‘lovlar holati va mijozlar tarixi. Yangi savdo ombor va moliyani avtomatik yangilaydi."
        actions={
          <>
            {perm.can('sales', 'export') && (
              <Button size="sm" onClick={() => {
                downloadCSV('savdo.csv', [['ID', 'Mijoz', 'Summa', 'To‘langan', 'Holat', 'Sana'], ...rows.map((o) => [o.id, data.customers.find((c) => c.id === o.customerId)?.name ?? '', o.amount, o.paidAmount, PAYMENT_LABEL[o.payment], o.date])])
                toast('success', 'Eksport tayyor.', 'savdo.csv yuklab olindi')
              }}><Download />Export</Button>
            )}
            {perm.can('sales', 'create') && <Button size="sm" variant="primary" onClick={openNew}><Plus />Yangi savdo</Button>}
          </>
        }
      />

      <div className="kpi-grid">
        {[
          { label: 'Jami savdo', value: formatCompact(totalSales), icon: <ShoppingCart />, sub: `${completed.length} ta buyurtma` },
          { label: 'Tushum (to‘langan)', value: formatCompact(revenue), icon: <ShoppingCart />, sub: 'naqd kelgan pul' },
          { label: 'Buyurtmalar', value: String(data.orders.length), icon: <ShoppingCart />, sub: 'shu oyda yaratilgan' },
          { label: "O'rtacha chek", value: formatCompact(avgOrder), icon: <ShoppingCart />, sub: 'buyurtma kesimida' },
        ].map((k) => (
          <div key={k.label} className="card kpi">
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <span className="kpi-delta up">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row-between wrap mb-2" style={{ marginBottom: 16 }}>
          <p className="card-title">Buyurtmalar ro‘yxati</p>
          <FilterChips
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { key: 'all', label: 'Barchasi' }, { key: 'paid', label: 'To‘langan' },
              { key: 'partial', label: 'Qismiy' }, { key: 'unpaid', label: 'To‘lanmagan' },
            ]}
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(o) => o.id}
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Buyurtma ID yoki mijoz izlash..."
          onRowClick={(o) => setDetail(o)}
          mobileTitle={(o) => <span className="mono">{o.id}</span>}
          mobileSubtitle={(o) => data.customers.find((c) => c.id === o.customerId)?.name}
          placeholder={{ title: 'Buyurtmalar topilmadi', text: 'Qidiruv yoki filtrni o‘zgartirib ko‘ring.', icon: <Filter /> }}
        />
      </div>

      {/* ---------- New/Edit order modal ---------- */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editOrder ? `Buyurtmani tahrirlash — ${editOrder.id}` : 'Yangi savdo'}
        subtitle="Mahsulot qo‘shilganda ombor qoldig‘i va moliya avtomatik yangilanadi"
        size="lg"
        footer={
          <>
            <Button onClick={() => setFormOpen(false)}>Bekor qilish</Button>
            <Button variant="primary" loading={saving} onClick={submit as any}>{editOrder ? 'Saqlash' : 'Savdoni yaratish'}</Button>
          </>
        }
      >
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div className="grid-2">
            <Field label="Mijoz" required>
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
              </Select>
            </Field>
            <Field label="To‘lov holati" required>
              <Select value={payment} onChange={(e) => setPayment(e.target.value as any)}>
                <option value="paid">To‘langan</option>
                <option value="partial">Qismiy to‘lov</option>
                <option value="unpaid">Qarz (keyinroq)</option>
              </Select>
            </Field>
          </div>

          <div className="field">
            <label>Mahsulotlar <span className="req">*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {items.map((it, idx) => {
                const product = data.products.find((p) => p.id === it.productId)
                return (
                  <div key={idx} className="row wrap" style={{ gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
                    <Select
                      value={it.productId}
                      onChange={(e) => {
                        const p = data.products.find((x) => x.id === e.target.value)
                        setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, productId: e.target.value, price: p?.salePrice ?? x.price } : x)))
                      }}
                      style={{ flex: '1 1 220px' }}
                    >
                      {data.products.filter((p) => p.type === 'finished').map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit} mavjud)</option>
                      ))}
                    </Select>
                    <Input
                      type="number" min={1} value={it.qty} style={{ width: 90 }}
                      onChange={(e) => setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x)))}
                      aria-label="Miqdor"
                    />
                    <Input
                      type="number" value={it.price} style={{ width: 130 }}
                      onChange={(e) => setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))}
                      aria-label="Narx"
                    />
                    <span className="fs-12 mono text-2" style={{ minWidth: 110, textAlign: 'right' }}>{formatCompact(it.qty * it.price)}</span>
                    <button type="button" className="modal-x" onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))} aria-label="O‘chirish"><X /></button>
                  </div>
                )
              })}
              <Button size="sm" onClick={addItem} type="button"><Plus />Mahsulot qo‘shish</Button>
            </div>
          </div>

          {payment === 'partial' && (
            <Field label="To‘langan summa" required>
              <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Summa so‘mda" />
            </Field>
          )}

          <div className="stat-mini" style={{ background: 'var(--accent-soft)', border: '1px solid rgba(139,92,246,.3)' }}>
            <span className="fs-13 text-2">Jami summa</span>
            <span className="font-display fw-7 mono" style={{ fontSize: 19 }}>{formatUZS(total)}</span>
          </div>
          {payment !== 'unpaid' && (
            <div className="row-between fs-13 text-2">
              <span>To‘lanadi: <b className="t-success mono">{formatUZS(effectivePaid)}</b></span>
              {total - effectivePaid > 0 && <span>Qarz: <b className="t-danger mono">{formatUZS(total - effectivePaid)}</b></span>}
            </div>
          )}
          {formError && <p className="field-error"><span>⚠</span>{formError}</p>}
        </form>
      </Modal>

      {/* ---------- Detail drawer ---------- */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={`Buyurtma ${detail?.id ?? ''}`} subtitle={detail ? timeAgo(detail.date) : ''}
        footer={
          detail && detail.payment !== 'paid' ? (
            <Button variant="primary" onClick={() => {
              dispatch({ type: 'ADD_PAYMENT', orderId: detail.id, amount: detail.amount - detail.paidAmount })
              toast('success', 'To‘lov qabul qilindi.', `${detail.id} to‘liq yopildi — cash flow yangilandi`)
              setDetail(null)
            }}>Qolgan qarzni to‘lash deb belgilash</Button>
          ) : undefined
        }
      >
        {detail && (() => {
          const cust = data.customers.find((c) => c.id === detail.customerId)
          const stats = detail.customerId ? customerStats(detail.customerId, data) : null
          return (
            <>
              <div className="stat-mini mb-2">
                <span className="text-2 fs-13">Mijoz</span>
                <span className="fw-6 fs-13">{cust?.name}</span>
              </div>
              <div className="stat-mini mb-2">
                <span className="text-2 fs-13">Holat</span>
                <Badge variant={PAYMENT_VARIANT[detail.payment]}>{PAYMENT_LABEL[detail.payment]}</Badge>
              </div>
              <div className="stat-mini mb-2">
                <span className="text-2 fs-13">Jami</span>
                <span className="mono fw-6">{formatUZS(detail.amount)}</span>
              </div>
              <div className="stat-mini mb-2">
                <span className="text-2 fs-13">To‘langan</span>
                <span className="mono fw-6 t-success">{formatUZS(detail.paidAmount)}</span>
              </div>
              {detail.amount - detail.paidAmount > 0 && (
                <div className="stat-mini mb-2" style={{ border: '1px solid rgba(248,113,113,.3)' }}>
                  <span className="text-2 fs-13">Qarz</span>
                  <span className="mono fw-6 t-danger">{formatUZS(detail.amount - detail.paidAmount)}</span>
                </div>
              )}

              <p className="card-title mt-3 mb-2">Pozitsiyalar</p>
              {detail.items.map((it, i) => {
                const p = data.products.find((x) => x.id === it.productId)
                return (
                  <div key={i} className="stat-mini mb-1">
                    <div>
                      <p className="fw-6 fs-13">{p?.name}</p>
                      <p className="fs-11 text-3">{it.qty} × {formatUZS(it.price)}</p>
                    </div>
                    <span className="mono fw-6 fs-13">{formatCompact(it.qty * it.price)}</span>
                  </div>
                )
              })}

              {stats && (
                <>
                  <p className="card-title mt-3 mb-2">Mijoz tarixi</p>
                  <div className="stat-mini mb-1"><span className="text-2 fs-12">Buyurtmalar</span><span className="fw-6">{stats.ordersCount}</span></div>
                  <div className="stat-mini mb-1"><span className="text-2 fs-12">Jami xarid</span><span className="mono fw-6">{formatCompact(stats.totalPurchases)}</span></div>
                  <div className="stat-mini"><span className="text-2 fs-12">Joriy qarz</span><span className="mono fw-6 t-danger">{formatCompact(stats.debt)}</span></div>
                </>
              )}
            </>
          )
        })()}
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Buyurtmani o‘chirish"
        message={`${deleting?.id} buyurtmasi o‘chiriladi. Ombor qoldig‘i va moliyaviy yozuvlar qaytariladi. Davom etasizmi?`}
        onConfirm={() => {
          if (!deleting) return
          dispatch({ type: 'DELETE_ORDER', id: deleting.id })
          toast('delete', `Buyurtma o‘chirildi: ${deleting.id}`)
          setDeleting(null)
        }}
      />

      <p className="fs-12 text-3 mt-2 center">
        Foydalanuvchi: <b>{user?.name}</b> • Yangi savdo yaratilganda tushum, ombor qoldig‘i va mijoz tarixi avtomatik yangilanadi.
      </p>
    </div>
  )
}
