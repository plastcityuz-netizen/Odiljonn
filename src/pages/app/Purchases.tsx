import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Clock, Download, Eye, Plus, Trash2, Truck, Package, X } from 'lucide-react'
import { useData } from '../../lib/store'
import { usePerm } from '../../components/layout/Guarded'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Field, Input, Select } from '../../components/ui/primitives'
import { ConfirmDialog, Drawer, Modal } from '../../components/ui/modals'
import { DataTable, FilterChips, type Column } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/toast'
import { downloadCSV, formatCompact, formatUZS, addDays } from '../../lib/utils'
import { payables } from '../../lib/analytics'
import type { Purchase, PurchaseItem, Supplier } from '../../lib/types'

const STATUS_META = {
  pending: { label: 'Kutilmoqda', variant: 'warning' as const },
  approved: { label: 'Tasdiqlangan', variant: 'info' as const },
  received: { label: 'Qabul qilingan', variant: 'accent' as const },
  paid: { label: 'To‘langan', variant: 'success' as const },
}

export default function Purchases() {
  const { data, dispatch } = useData()
  const perm = usePerm()
  const { toast } = useToast()
  const [params] = useSearchParams()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detail, setDetail] = useState<Purchase | null>(null)
  const [formOpen, setFormOpen] = useState(params.get('new') === '1')
  const [deleting, setDeleting] = useState<Purchase | null>(null)
  const [supplierForm, setSupplierForm] = useState<Supplier | null>(null)
  const [saving, setSaving] = useState(false)

  // purchase form
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [status, setStatus] = useState<Purchase['status']>('pending')
  const [expected, setExpected] = useState(addDays(new Date().toISOString(), 5))
  const [formError, setFormError] = useState('')

  // supplier form
  const [supName, setSupName] = useState('')
  const [supContact, setSupContact] = useState('')
  const [supPhone, setSupPhone] = useState('')
  const [supCategory, setSupCategory] = useState('')
  const [supErrors, setSupErrors] = useState<Record<string, string>>({})

  const pay = payables(data)
  const rows = useMemo(() => {
    let list = [...data.purchases]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((p) => p.id.toLowerCase().includes(s) || (data.suppliers.find((x) => x.id === p.supplierId)?.name.toLowerCase().includes(s) ?? false))
    }
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter)
    return list
  }, [data.purchases, data.suppliers, search, statusFilter])

  const total = items.reduce((s, it) => s + it.qty * it.price, 0)

  const openNew = () => {
    setSupplierId(data.suppliers[0]?.id ?? '')
    setItems([])
    setStatus('pending')
    setExpected(addDays(new Date().toISOString(), 5))
    setFormError('')
    setFormOpen(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) return setFormError('Yetkazib beruvchini tanlang.')
    if (!items.length) return setFormError('Kamida bitta pozitsiya qo‘shing.')
    setSaving(true)
    setTimeout(() => {
      dispatch({
        type: 'ADD_PURCHASE',
        purchase: {
          supplierId, items, amount: total, status,
          expectedDate: expected,
        },
      })
      toast('success', 'Xarid buyurtmasi yaratildi.', `${formatUZS(total)} • ${STATUS_META[status].label}`)
      setSaving(false); setFormOpen(false)
    }, 600)
  }

  const submitSupplier = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (supName.trim().length < 2) errs.name = 'Nomini kiriting.'
    if (!/^[+\d\s()-]{7,}$/.test(supPhone)) errs.phone = 'Telefon kiriting.'
    setSupErrors(errs)
    if (Object.keys(errs).length) return
    if (supplierForm) {
      dispatch({ type: 'UPDATE_SUPPLIER', supplier: { ...supplierForm, name: supName, contact: supContact, phone: supPhone, category: supCategory } })
      toast('success', 'Yetkazib beruvchi yangilandi.')
    } else {
      dispatch({ type: 'ADD_SUPPLIER', supplier: { name: supName, contact: supContact, phone: supPhone, category: supCategory || 'Boshqa', rating: 4.0 } })
      toast('success', 'Yangi yetkazib beruvchi qo‘shildi.', supName)
    }
    setSupplierForm(null)
  }

  const advance = (p: Purchase) => {
    const order: Purchase['status'][] = ['pending', 'approved', 'received', 'paid']
    const next = order[Math.min(order.length - 1, order.indexOf(p.status) + 1)]
    dispatch({ type: 'SET_PURCHASE_STATUS', id: p.id, status: next })
    if (next === 'received') toast('success', 'Ombor qabul qildi.', 'Mahsulot qoldiqlari oshdi')
    else if (next === 'paid') toast('success', 'To‘lov amalga oshirildi.', 'Xarajat sifatida qayd etildi')
    else toast('success', `Holat: ${STATUS_META[next].label}`, p.id)
    setDetail(null)
  }

  const purchaseColumns: Column<Purchase>[] = [
    {
      key: 'id', header: 'Xarid', sortValue: (p) => p.id,
      render: (p) => (<div><p className="fw-6 fs-13 mono">{p.id}</p><p className="fs-11 text-3">{new Date(p.date).toLocaleDateString('uz')}</p></div>),
    },
    {
      key: 'supplier', header: 'Yetkazib beruvchi', sortValue: (p) => data.suppliers.find((s) => s.id === p.supplierId)?.name ?? '',
      render: (p) => {
        const s = data.suppliers.find((x) => x.id === p.supplierId)
        return <div><p className="fw-6 fs-13">{s?.name ?? '—'}</p><p className="fs-11 text-3">{s?.category}</p></div>
      },
    },
    { key: 'items', header: 'Pozitsiyalar', render: (p) => <span className="fs-12 text-2">{p.items.length ? `${p.items.length} ta` : 'Xizmat'}</span> },
    { key: 'amount', header: 'Summa', align: 'right', sortValue: (p) => p.amount, render: (p) => <span className="mono fw-6 fs-13">{formatCompact(p.amount)}</span> },
    { key: 'status', header: 'Holat', sortValue: (p) => p.status, render: (p) => <Badge variant={STATUS_META[p.status].variant}>{STATUS_META[p.status].label}</Badge> },
    {
      key: 'actions', header: '', align: 'right',
      render: (p) => (
        <div className="row-actions">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(p) }} aria-label="Ko‘rish"><Eye /></Button>
          {perm.can('purchases', 'edit') && p.status !== 'paid' && (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); advance(p) }} aria-label="Keyingi holat"><Check /></Button>
          )}
          {perm.can('purchases', 'delete') && <Button size="sm" variant="ghost" className="t-danger" onClick={(e) => { e.stopPropagation(); setDeleting(p) }} aria-label="O‘chirish"><Trash2 /></Button>}
        </div>
      ),
    },
  ]

  const supplierColumns: Column<Supplier>[] = [
    {
      key: 'name', header: 'Yetkazib beruvchi', sortValue: (s) => s.name,
      render: (s) => <div><p className="fw-6 fs-13">{s.name}</p><p className="fs-11 text-3">{s.contact}</p></div>,
    },
    { key: 'phone', header: 'Telefon', render: (s) => <span className="fs-13 mono text-2">{s.phone}</span> },
    { key: 'category', header: 'Toifa', sortValue: (s) => s.category, render: (s) => <Badge variant="neutral">{s.category}</Badge> },
    { key: 'rating', header: 'Reyting', align: 'right', sortValue: (s) => s.rating, render: (s) => <span className="mono fw-6 fs-13 t-accent">★ {s.rating}</span> },
    { key: 'purchases', header: 'Xaridlar', align: 'right', sortValue: (s) => data.purchases.filter((p) => p.supplierId === s.id).length, render: (s) => <span className="mono fw-6 fs-13">{data.purchases.filter((p) => p.supplierId === s.id).length}</span> },
    {
      key: 'actions', header: '', align: 'right',
      render: (s) => (
        <div className="row-actions">
          {perm.can('purchases', 'edit') && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSupplierForm(s); setSupName(s.name); setSupContact(s.contact); setSupPhone(s.phone); setSupCategory(s.category) }} aria-label="Tahrirlash"><Truck /></Button>}
        </div>
      ),
    },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Xaridlar"
        sub="Yetkazib beruvchilar va xarid buyurtmalari. Qabul qilingan xarid omborni, to‘langani moliyani avtomatik yangilaydi."
        actions={
          <>
            {perm.can('purchases', 'export') && (
              <Button size="sm" onClick={() => {
                downloadCSV('xaridlar.csv', [['ID', 'Yetkazib beruvchi', 'Summa', 'Holat', 'Sana'], ...rows.map((p) => [p.id, data.suppliers.find((s) => s.id === p.supplierId)?.name ?? '', p.amount, STATUS_META[p.status].label, p.date])])
                toast('success', 'Eksport tayyor.', 'xaridlar.csv yuklab olindi')
              }}><Download />Export</Button>
            )}
            {perm.can('purchases', 'create') && <Button size="sm" variant="primary" onClick={openNew}><Plus />Yangi xarid</Button>}
          </>
        }
      />

      <div className="kpi-grid">
        {[
          { label: 'Jami xaridlar', value: String(data.purchases.length), sub: 'bu oy' },
          { label: 'To‘langan', value: formatCompact(data.purchases.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)), sub: 'xarajat sifatida' },
          { label: 'Kutilmoqda', value: formatCompact(data.purchases.filter((p) => p.status === 'pending' || p.status === 'approved').reduce((s, p) => s + p.amount, 0)), sub: 'tasdiq kutayotgan' },
          { label: 'Qarz (payable)', value: formatCompact(pay.reduce((s, p) => s + p.purchase.amount, 0)), sub: `${pay.length} ta to‘lanmagan` },
        ].map((k) => (
          <div key={k.label} className="card kpi">
            <div className="kpi-icon"><Truck /></div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <span className="kpi-delta up">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row-between wrap mb-2" style={{ marginBottom: 16 }}>
          <p className="card-title">Xarid buyurtmalari</p>
          <FilterChips value={statusFilter} onChange={setStatusFilter} options={[
            { key: 'all', label: 'Barchasi' }, { key: 'pending', label: 'Kutilmoqda' },
            { key: 'approved', label: 'Tasdiqlangan' }, { key: 'received', label: 'Qabul qilingan' }, { key: 'paid', label: 'To‘langan' },
          ]} />
        </div>
        <DataTable
          columns={purchaseColumns}
          rows={rows}
          rowKey={(p) => p.id}
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Xarid ID yoki yetkazib beruvchi..."
          onRowClick={(p) => setDetail(p)}
          mobileTitle={(p) => <span className="mono">{p.id}</span>}
          mobileSubtitle={(p) => data.suppliers.find((s) => s.id === p.supplierId)?.name}
          placeholder={{ title: 'Xarid topilmadi', text: 'Yangi xarid buyurtmasi yarating.', icon: <Truck /> }}
        />
      </div>

      <div className="card mt-3">
        <div className="row-between wrap mb-2" style={{ marginBottom: 16 }}>
          <div>
            <p className="card-title">Yetkazib beruvchilar</p>
            <p className="card-sub">{data.suppliers.length} ta hamkor</p>
          </div>
          {perm.can('purchases', 'create') && (
            <Button size="sm" onClick={() => { setSupplierForm({ id: '', name: '', contact: '', phone: '', category: '', rating: 4 }); setSupName(''); setSupContact(''); setSupPhone(''); setSupCategory(''); setSupErrors({}) }}>
              <Plus />Yetkazib beruvchi
            </Button>
          )}
        </div>
        <DataTable
          columns={supplierColumns}
          rows={data.suppliers}
          rowKey={(s) => s.id}
          pageSize={6}
          placeholder={{ title: 'Yetkazib beruvchi yo‘q', text: 'Yangi hamkor qo‘shing.', icon: <Truck /> }}
        />
      </div>

      {/* new purchase */}
      <Modal
        open={formOpen} onClose={() => setFormOpen(false)}
        title="Yangi xarid buyurtmasi"
        subtitle="«Qabul qilingan» holatida ombor qoldig‘i oshadi, «To‘langan» — xarajat yoziladi"
        size="lg"
        footer={
          <>
            <Button onClick={() => setFormOpen(false)}>Bekor qilish</Button>
            <Button variant="primary" loading={saving} onClick={submit as any}>Yaratish</Button>
          </>
        }
      >
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div className="grid-2">
            <Field label="Yetkazib beruvchi" required>
              <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                {data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.category}</option>)}
              </Select>
            </Field>
            <Field label="Boshlang‘ich holat">
              <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </Field>
          </div>

          <Field label="Pozitsiyalar" required>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {items.map((it, idx) => (
                <div key={idx} className="row wrap" style={{ gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
                  <Select
                    value={it.productId}
                    onChange={(e) => setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, productId: e.target.value, price: data.products.find((p) => p.id === e.target.value)?.costPrice ?? x.price } : x)))}
                    style={{ flex: '1 1 220px' }}
                  >
                    {data.products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>)}
                  </Select>
                  <Input type="number" min={1} value={it.qty} style={{ width: 90 }} onChange={(e) => setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x)))} aria-label="Miqdor" />
                  <Input type="number" value={it.price} style={{ width: 130 }} onChange={(e) => setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))} aria-label="Narx" />
                  <span className="fs-12 mono text-2" style={{ minWidth: 100, textAlign: 'right' }}>{formatCompact(it.qty * it.price)}</span>
                  <button type="button" className="modal-x" onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))} aria-label="O‘chirish"><X /></button>
                </div>
              ))}
              <Button size="sm" type="button" onClick={() => {
                const p = data.products[0]
                if (p) setItems((arr) => [...arr, { productId: p.id, qty: 10, price: p.costPrice }])
              }}><Plus />Pozitsiya qo‘shish</Button>
            </div>
          </Field>

          <Field label="Kutilayotgan yetkazib berish sanasi">
            <Input type="date" value={expected.slice(0, 10)} onChange={(e) => setExpected(new Date(e.target.value).toISOString())} />
          </Field>

          <div className="stat-mini" style={{ background: 'var(--accent-soft)', border: '1px solid rgba(139,92,246,.3)' }}>
            <span className="fs-13 text-2">Jami summa</span>
            <span className="font-display fw-7 mono" style={{ fontSize: 19 }}>{formatUZS(total)}</span>
          </div>
          {formError && <p className="field-error"><span>⚠</span>{formError}</p>}
        </form>
      </Modal>

      {/* supplier form */}
      <Modal
        open={!!supplierForm} onClose={() => setSupplierForm(null)}
        title="Yetkazib beruvchi"
        footer={
          <>
            <Button onClick={() => setSupplierForm(null)}>Bekor qilish</Button>
            <Button variant="primary" onClick={submitSupplier as any}>Saqlash</Button>
          </>
        }
      >
        <form onSubmit={submitSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Field label="Nomi" required error={supErrors.name}>
            <Input value={supName} onChange={(e) => setSupName(e.target.value)} placeholder="Toshkent Qog‘oz Savdo" invalid={!!supErrors.name} />
          </Field>
          <div className="grid-2">
            <Field label="Kontakt shaxsi">
              <Input value={supContact} onChange={(e) => setSupContact(e.target.value)} placeholder="Alisher Yo‘ldoshev" />
            </Field>
            <Field label="Telefon" required error={supErrors.phone}>
              <Input value={supPhone} onChange={(e) => setSupPhone(e.target.value)} placeholder="+998 71 297-40-11" invalid={!!supErrors.phone} />
            </Field>
          </div>
          <Field label="Toifa">
            <Input value={supCategory} onChange={(e) => setSupCategory(e.target.value)} placeholder="Qog‘oz xomashyosi" />
          </Field>
        </form>
      </Modal>

      {/* purchase detail */}
      <Drawer
        open={!!detail} onClose={() => setDetail(null)}
        title={`Xarid ${detail?.id ?? ''}`}
        subtitle={detail ? data.suppliers.find((s) => s.id === detail.supplierId)?.name : ''}
        footer={detail && perm.can('purchases', 'edit') && detail.status !== 'paid' ? (
          <Button variant="primary" onClick={() => advance(detail)}>
            <Check />Keyingi holat: {STATUS_META[( ['approved', 'received', 'paid'] as const )[['pending', 'approved', 'received'].indexOf(detail.status)] ?? 'approved'].label}
          </Button>
        ) : undefined}
      >
        {detail && (
          <>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Holat</span><Badge variant={STATUS_META[detail.status].variant}>{STATUS_META[detail.status].label}</Badge></div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Jami summa</span><span className="mono fw-6">{formatUZS(detail.amount)}</span></div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Buyurtma sanasi</span><span className="fs-13 mono">{new Date(detail.date).toLocaleDateString('uz')}</span></div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Yetkazib berish</span><span className="fs-13 mono">{new Date(detail.expectedDate).toLocaleDateString('uz')}</span></div>

            <p className="card-title mt-3 mb-2">Pozitsiyalar</p>
            {detail.items.length === 0 && <p className="fs-13 text-3 center" style={{ padding: 16 }}>Xizmat xaridi (pozitsiyasiz).</p>}
            {detail.items.map((it, i) => {
              const p = data.products.find((x) => x.id === it.productId)
              return (
                <div key={i} className="stat-mini mb-1">
                  <div><p className="fw-6 fs-13">{p?.name}</p><p className="fs-11 text-3">{it.qty} × {formatCompact(it.price)}</p></div>
                  <span className="mono fw-6 fs-13">{formatCompact(it.qty * it.price)}</span>
                </div>
              )
            })}

            {detail.status !== 'paid' && (
              <div className="card mt-3" style={{ background: 'var(--warning-soft)', border: '1px solid rgba(251,191,36,.3)', padding: 14 }}>
                <p className="fs-12" style={{ lineHeight: 1.6 }}>
                  <Clock style={{ width: 13, height: 13, display: 'inline', marginRight: 4, color: 'var(--warning)' }} />
                  Bu xarid hali to‘lanmagan — <b>{formatCompact(detail.amount)}</b> kreditor qarzi sifatida qarzdorlik bo‘limida ko‘rinadi.
                </p>
              </div>
            )}
            {detail.status === 'received' || detail.status === 'paid' ? (
              <div className="card mt-2" style={{ background: 'var(--success-soft)', border: '1px solid rgba(52,211,153,.3)', padding: 14 }}>
                <p className="fs-12" style={{ lineHeight: 1.6 }}>
                  <Package style={{ width: 13, height: 13, display: 'inline', marginRight: 4, color: 'var(--success)' }} />
                  Ombor qabul qilgan — mahsulot qoldiqlari avtomatik oshirildi.
                </p>
              </div>
            ) : null}
          </>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Xaridni o‘chirish"
        message={`${deleting?.id} o‘chiriladi. Agar xarid qabul qilingan bo‘lsa, ombor qoldig‘i qaytariladi.`}
        onConfirm={() => {
          if (!deleting) return
          dispatch({ type: 'DELETE_PURCHASE', id: deleting.id })
          toast('delete', `Xarid o‘chirildi: ${deleting.id}`)
          setDeleting(null)
        }}
      />
    </div>
  )
}
