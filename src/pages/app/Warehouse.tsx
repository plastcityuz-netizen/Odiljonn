import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Boxes, Download, Eye, Pencil, Plus, Package, Trash2, X } from 'lucide-react'
import { useData } from '../../lib/store'
import { usePerm } from '../../components/layout/Guarded'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Field, Input, Select } from '../../components/ui/primitives'
import { ConfirmDialog, Drawer, Modal } from '../../components/ui/modals'
import { DataTable, FilterChips, type Column } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/toast'
import { downloadCSV, formatCompact, formatUZS } from '../../lib/utils'
import { inventoryValue, lowStockProducts, outOfStockProducts } from '../../lib/analytics'
import type { Product } from '../../lib/types'

type StockFilter = { productId: string; qty: number; reason: string; delta: number }

export default function Warehouse() {
  const { data, dispatch } = useData()
  const perm = usePerm()
  const { toast } = useToast()
  const [params] = useSearchParams()

  const [search, setSearch] = useState(params.get('q') ?? '')
  const [filter, setFilter] = useState<'all' | 'finished' | 'raw' | 'low' | 'out'>('all')
  const [detail, setDetail] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editPrd, setEditPrd] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [adjustOpen, setAdjustOpen] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  // form
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('Ofis jihozlari')
  const [unit, setUnit] = useState('dona')
  const [type, setType] = useState<'finished' | 'raw'>('finished')
  const [stock, setStock] = useState('0')
  const [minStock, setMinStock] = useState('0')
  const [costPrice, setCostPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // adjust form
  const [adjQty, setAdjQty] = useState('10')
  const [adjReason, setAdjReason] = useState('Inventarizatsiya')

  const low = lowStockProducts(data.products)
  const outS = outOfStockProducts(data.products)

  const rows = useMemo(() => {
    let list = [...data.products]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.category.toLowerCase().includes(s))
    }
    if (filter === 'finished') list = list.filter((p) => p.type === 'finished')
    if (filter === 'raw') list = list.filter((p) => p.type === 'raw')
    if (filter === 'low') list = list.filter((p) => p.type === 'finished' && p.stock > 0 && p.stock <= p.minStock)
    if (filter === 'out') list = list.filter((p) => p.type === 'finished' && p.stock === 0)
    return list
  }, [data.products, search, filter])

  const openNew = () => {
    setEditPrd(null); setName(''); setSku(''); setUnit('dona'); setType('finished')
    setStock('0'); setMinStock('0'); setCostPrice(''); setSalePrice(''); setErrors({})
    setFormOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditPrd(p); setName(p.name); setSku(p.sku); setCategory(p.category); setUnit(p.unit); setType(p.type)
    setStock(String(p.stock)); setMinStock(String(p.minStock)); setCostPrice(String(p.costPrice)); setSalePrice(String(p.salePrice)); setErrors({})
    setFormOpen(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (name.trim().length < 2) errs.name = 'Nomini kiriting.'
    if (sku.trim().length < 2) errs.sku = 'SKU kiriting.'
    if (type === 'finished' && Number(salePrice) <= 0) errs.salePrice = 'Sotish narxini kiriting.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    setTimeout(() => {
      const payload = {
        name: name.trim(), sku: sku.trim().toUpperCase(), category, unit, type,
        stock: Number(stock) || 0, minStock: Number(minStock) || 0,
        costPrice: Number(costPrice) || 0, salePrice: type === 'finished' ? Number(salePrice) || 0 : 0,
      }
      if (editPrd) {
        dispatch({ type: 'UPDATE_PRODUCT', product: { ...editPrd, ...payload } })
        toast('success', 'Mahsulot yangilandi.', name)
      } else {
        dispatch({ type: 'ADD_PRODUCT', product: payload })
        toast('success', 'Yangi mahsulot qo‘shildi.', `${name} omborga kiritildi`)
      }
      setSaving(false); setFormOpen(false)
    }, 600)
  }

  const stockStatus = (p: Product) => {
    if (p.type === 'raw') return <Badge variant="info">Xomashyo</Badge>
    if (p.stock === 0) return <Badge variant="danger">Tugagan</Badge>
    if (p.stock <= p.minStock) return <Badge variant="warning">Kam qold</Badge>
    return <Badge variant="success">Yetarli</Badge>
  }

  const columns: Column<Product>[] = [
    {
      key: 'name', header: 'Mahsulot', sortValue: (p) => p.name,
      render: (p) => (
        <div>
          <p className="fw-6 fs-13">{p.name}</p>
          <p className="fs-11 text-3 mono">{p.sku} • {p.category}</p>
        </div>
      ),
    },
    { key: 'stock', header: 'Qoldiq', align: 'right', sortValue: (p) => p.stock, render: (p) => <span className="mono fw-6 fs-13">{p.stock} <span className="text-3">{p.unit}</span></span> },
    { key: 'min', header: 'Min.', align: 'right', sortValue: (p) => p.minStock, render: (p) => <span className="fs-12 text-3 mono">{p.minStock}</span> },
    { key: 'cost', header: 'Tannarx', align: 'right', sortValue: (p) => p.costPrice, render: (p) => <span className="fs-12 mono text-2">{p.costPrice ? formatCompact(p.costPrice) : '—'}</span> },
    { key: 'sale', header: 'Sotish', align: 'right', sortValue: (p) => p.salePrice, render: (p) => <span className="fs-12 mono text-2">{p.salePrice ? formatCompact(p.salePrice) : '—'}</span> },
    { key: 'status', header: 'Holat', sortValue: (p) => (p.stock === 0 ? 0 : p.stock <= p.minStock ? 1 : 2), render: stockStatus },
    {
      key: 'value', header: 'Qiymat', align: 'right', sortValue: (p) => p.stock * p.costPrice,
      render: (p) => <span className="mono fs-12 fw-6">{formatCompact(p.stock * p.costPrice)}</span>,
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (p) => (
        <div className="row-actions">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(p) }} aria-label="Ko‘rish"><Eye /></Button>
          {perm.can('warehouse', 'edit') && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(p) }} aria-label="Tahrirlash"><Pencil /></Button>}
          {perm.can('warehouse', 'edit') && (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setAdjustOpen(p); setAdjQty('10') }} aria-label="Qoldiqni o‘zgartirish">
              <Boxes />
            </Button>
          )}
          {perm.can('warehouse', 'delete') && <Button size="sm" variant="ghost" className="t-danger" onClick={(e) => { e.stopPropagation(); setDeleting(p) }} aria-label="O‘chirish"><Trash2 /></Button>}
        </div>
      ),
    },
  ]

  // inventory movements (derived from orders + purchases + production)
  const movements = useMemo(() => {
    const list: { id: string; product: string; delta: number; reason: string; date: string }[] = []
    for (const o of data.orders.slice(0, 30)) {
      for (const it of o.items) {
        const p = data.products.find((x) => x.id === it.productId)
        if (p) list.push({ id: o.id, product: p.name, delta: -it.qty, reason: 'Savdo', date: o.date })
      }
    }
    for (const po of data.purchases) {
      if (po.status === 'received' || po.status === 'paid') {
        for (const it of po.items) {
          const p = data.products.find((x) => x.id === it.productId)
          if (p) list.push({ id: po.id, product: p.name, delta: it.qty, reason: 'Xarid', date: po.date })
        }
      }
    }
    for (const pr of data.production) {
      if (pr.status === 'completed') {
        const p = data.products.find((x) => x.id === pr.productId)
        if (p) list.push({ id: pr.id, product: p.name, delta: pr.qty, reason: 'Ishlab chiqarish', date: pr.date })
        for (const m of pr.materials) {
          const rm = data.products.find((x) => x.id === m.productId)
          if (rm) list.push({ id: pr.id, product: rm.name, delta: -m.qty, reason: 'Xomashyo sarfi', date: pr.date })
        }
      }
    }
    return list.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 12)
  }, [data])

  return (
    <div className="page">
      <PageHeader
        title="Ombor"
        sub="Mahsulot qoldiqlari, inventar harakatlari va xavf ogohlantirishlari."
        actions={
          <>
            {perm.can('warehouse', 'export') && (
              <Button size="sm" onClick={() => {
                downloadCSV('ombor.csv', [['Nomi', 'SKU', 'Toifa', 'Qoldiq', 'Min', 'Tannarx', 'Sotish narxi', 'Qiymat'], ...rows.map((p) => [p.name, p.sku, p.category, p.stock, p.minStock, p.costPrice, p.salePrice, p.stock * p.costPrice])])
                toast('success', 'Eksport tayyor.', 'ombor.csv yuklab olindi')
              }}><Download />Export</Button>
            )}
            {perm.can('warehouse', 'create') && <Button size="sm" variant="primary" onClick={openNew}><Plus />Yangi mahsulot</Button>}
          </>
        }
      />

      <div className="kpi-grid">
        <div className="card kpi" onClick={() => setFilter('all')} role="button" tabIndex={0}>
          <div className="kpi-icon"><Package /></div>
          <div className="kpi-label">Mahsulot turlari</div>
          <div className="kpi-value">{data.products.length}</div>
          <span className="kpi-delta up">{data.products.filter((p) => p.type === 'raw').length} xomashyo</span>
        </div>
        <div className="card kpi">
          <div className="kpi-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><Boxes /></div>
          <div className="kpi-label">Ombor qiymati</div>
          <div className="kpi-value">{formatCompact(inventoryValue(data.products))}</div>
          <span className="kpi-delta up">tannarx bo‘yicha</span>
        </div>
        <div className="card kpi" onClick={() => setFilter('low')} role="button" tabIndex={0}>
          <div className="kpi-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}><AlertTriangle /></div>
          <div className="kpi-label">Kam qolgan</div>
          <div className="kpi-value">{low.length}</div>
          <span className="kpi-delta down">minimal qoldiqdan past</span>
        </div>
        <div className="card kpi" onClick={() => setFilter('out')} role="button" tabIndex={0}>
          <div className="kpi-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}><X /></div>
          <div className="kpi-label">Tugagan</div>
          <div className="kpi-value">{outS.length}</div>
          <span className="kpi-delta down">zudlik bilan xarid</span>
        </div>
      </div>

      <div className="card">
        <div className="row-between wrap mb-2" style={{ marginBottom: 16 }}>
          <p className="card-title">Mahsulotlar</p>
          <FilterChips
            value={filter}
            onChange={(v) => setFilter(v as any)}
            options={[
              { key: 'all', label: 'Barchasi' }, { key: 'finished', label: 'Tayyor mahsulot' },
              { key: 'raw', label: 'Xomashyo' }, { key: 'low', label: `Kam qold (${low.length})` }, { key: 'out', label: `Tugagan (${outS.length})` },
            ]}
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(p) => p.id}
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Nomi, SKU yoki toifa..."
          onRowClick={(p) => setDetail(p)}
          mobileTitle={(p) => p.name}
          mobileSubtitle={(p) => `${p.sku} • ${p.stock} ${p.unit}`}
          placeholder={{ title: 'Omborda hali mahsulot yo‘q.', text: 'Birinchi mahsulotingizni qo‘shing.', icon: <Package />, action: perm.can('warehouse', 'create') ? <Button variant="primary" size="sm" onClick={openNew}><Plus />Mahsulot qo‘shish</Button> : undefined }}
        />
      </div>

      <div className="card mt-3">
        <p className="card-title mb-2">Inventar harakatlari</p>
        <p className="card-sub mb-2" style={{ marginTop: -8 }}>Savdo, xarid va ishlab chiqarishdan avtomatik yozuvlar</p>
        <div className="table-wrap has-cards">
          <table className="table">
            <thead><tr><th>Manba</th><th>Mahsulot</th><th>Sabab</th><th className="right">O‘zgarish</th><th>Sana</th></tr></thead>
            <tbody>
              {movements.map((m, i) => (
                <tr key={i}>
                  <td className="mono fs-12 fw-6">{m.id}</td>
                  <td className="fs-13">{m.product}</td>
                  <td><Badge variant={m.reason === 'Savdo' ? 'warning' : m.reason === 'Xarid' ? 'info' : 'accent'}>{m.reason}</Badge></td>
                  <td className="right mono fw-6 fs-13" style={{ color: m.delta > 0 ? 'var(--success)' : 'var(--danger)' }}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td className="fs-12 text-3">{new Date(m.date).toLocaleDateString('uz')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-cards">
            {movements.map((m, i) => (
              <div key={i} className="table-card-item">
                <div className="table-card-row"><span className="table-card-label">Mahsulot</span><span className="fw-6 fs-13">{m.product}</span></div>
                <div className="table-card-row"><span className="table-card-label">Sabab</span><span>{m.reason} ({m.id})</span></div>
                <div className="table-card-row"><span className="table-card-label">O‘zgarish</span><span className="mono fw-6" style={{ color: m.delta > 0 ? 'var(--success)' : 'var(--danger)' }}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* form */}
      <Modal
        open={formOpen} onClose={() => setFormOpen(false)}
        title={editPrd ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
        subtitle="Tayyor mahsulot sotiladi, xomashyo ishlab chiqarishda ishlatiladi"
        footer={
          <>
            <Button onClick={() => setFormOpen(false)}>Bekor qilish</Button>
            <Button variant="primary" loading={saving} onClick={submit as any}>{editPrd ? 'Saqlash' : 'Qo‘shish'}</Button>
          </>
        }
      >
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Field label="Nomi" required error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Ofis qog‘ozi A4" invalid={!!errors.name} />
          </Field>
          <div className="grid-2">
            <Field label="SKU" required error={errors.sku}>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="OS-QOG-A4" invalid={!!errors.sku} />
            </Field>
            <Field label="Toifa">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ofis jihozlari" />
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Turi" required>
              <Select value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="finished">Tayyor mahsulot</option>
                <option value="raw">Xomashyo</option>
              </Select>
            </Field>
            <Field label="Birlik">
              <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                {['dona', 'paket', 'to‘plam', 'tonna', 'qop', 'chelak', 'rulon', 'metr'].map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Hozirgi qoldiq">
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min={0} />
            </Field>
            <Field label="Minimal qoldiq">
              <Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} min={0} />
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Tannarx (so‘m)">
              <Input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0" />
            </Field>
            {type === 'finished' && (
              <Field label="Sotish narxi (so‘m)" required error={errors.salePrice}>
                <Input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0" invalid={!!errors.salePrice} />
              </Field>
            )}
          </div>
        </form>
      </Modal>

      {/* adjust stock */}
      <Modal
        open={!!adjustOpen} onClose={() => setAdjustOpen(null)}
        title={`Qoldiqni o‘zgartirish — ${adjustOpen?.name ?? ''}`}
        subtitle={`Hozirgi qoldiq: ${adjustOpen?.stock ?? 0} ${adjustOpen?.unit ?? ''}`}
        footer={
          <>
            <Button onClick={() => setAdjustOpen(null)}>Bekor qilish</Button>
            <Button variant="primary" onClick={() => {
              if (!adjustOpen) return
              const qty = Number(adjQty) || 0
              dispatch({ type: 'ADJUST_STOCK', id: adjustOpen.id, delta: qty })
              toast('success', 'Qoldiq yangilandi.', `${adjustOpen.name}: ${qty > 0 ? '+' : ''}${qty} ${adjustOpen.unit}`)
              setAdjustOpen(null)
            }}>Qo‘llash</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Field label="O‘zgarish (musbat — kirim, manfiy — chiqim)" required>
            <Input type="number" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} />
          </Field>
          <Field label="Sabab">
            <Select value={adjReason} onChange={(e) => setAdjReason(e.target.value)}>
              {['Inventarizatsiya', 'Buzilish / yo‘qotish', 'Qaytarilgan tovar', 'Boshqa'].map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
          <div className="stat-mini">
            <span className="text-2 fs-13">Yangi qoldiq bo‘ladi</span>
            <span className="mono fw-6 fs-14">{(adjustOpen?.stock ?? 0) + (Number(adjQty) || 0)} {adjustOpen?.unit}</span>
          </div>
        </div>
      </Modal>

      {/* detail */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} subtitle={detail ? `${detail.sku} • ${detail.category}` : ''}
        footer={detail && perm.can('warehouse', 'edit') ? <Button variant="primary" onClick={() => { openEdit(detail); setDetail(null) }}><Pencil />Tahrirlash</Button> : undefined}>
        {detail && (
          <>
            <div className="grid-2" style={{ gap: 10 }}>
              <div className="stat-mini" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                <span className="fs-11 text-3">Qoldiq</span>
                <span className="font-display fw-7" style={{ fontSize: 19 }}>{detail.stock} <span className="fs-12 text-2">{detail.unit}</span></span>
              </div>
              <div className="stat-mini" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                <span className="fs-11 text-3">Minimal</span>
                <span className="font-display fw-7" style={{ fontSize: 19 }}>{detail.minStock}</span>
              </div>
            </div>
            <div className="grid-2 mt-2" style={{ gap: 10 }}>
              <div className="stat-mini" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                <span className="fs-11 text-3">Tannarx</span>
                <span className="font-display fw-7" style={{ fontSize: 16 }}>{detail.costPrice ? formatCompact(detail.costPrice) : '—'}</span>
              </div>
              <div className="stat-mini" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                <span className="fs-11 text-3">Sotish narxi</span>
                <span className="font-display fw-7" style={{ fontSize: 16 }}>{detail.salePrice ? formatCompact(detail.salePrice) : '—'}</span>
              </div>
            </div>
            <div className="stat-mini mt-2">
              <span className="text-2 fs-13">Umumiy qiymat</span>
              <span className="mono fw-6">{formatUZS(detail.stock * detail.costPrice)}</span>
            </div>
            {detail.salePrice > 0 && (
              <div className="stat-mini mt-2" style={{ background: 'var(--accent-soft)', border: '1px solid rgba(139,92,246,.3)' }}>
                <span className="text-2 fs-13">Marja</span>
                <span className="mono fw-6 t-accent">{Math.round(((detail.salePrice - detail.costPrice) / detail.salePrice) * 100)}%</span>
              </div>
            )}
            <div className="mt-2">{stockStatus(detail)}</div>

            <p className="card-title mt-3 mb-2">So‘nggi harakatlar</p>
            {movements.filter((m) => m.product === detail.name).slice(0, 8).map((m, i) => (
              <div key={i} className="stat-mini mb-1">
                <div><p className="fw-6 fs-12">{m.reason}</p><p className="fs-11 text-3 mono">{m.id}</p></div>
                <span className="mono fw-6 fs-13" style={{ color: m.delta > 0 ? 'var(--success)' : 'var(--danger)' }}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
              </div>
            ))}
          </>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Mahsulotni o‘chirish"
        message={`${deleting?.name} ombordan o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.`}
        onConfirm={() => {
          if (!deleting) return
          dispatch({ type: 'DELETE_PRODUCT', id: deleting.id })
          toast('delete', `Mahsulot o‘chirildi: ${deleting.name}`)
          setDeleting(null)
        }}
      />
    </div>
  )
}
