import React, { useMemo, useState } from 'react'
import { Check, Circle, Clock, Eye, Factory, Package, Play, Plus, Trash2, X, Zap } from 'lucide-react'
import { useData } from '../../lib/store'
import { usePerm } from '../../components/layout/Guarded'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Field, Input, Select } from '../../components/ui/primitives'
import { ConfirmDialog, Drawer, Modal } from '../../components/ui/modals'
import { DataTable, FilterChips, type Column } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/toast'
import { formatCompact, formatUZS } from '../../lib/utils'
import type { ProductionCosts, ProductionOrder } from '../../lib/types'

const STATUS_META = {
  planned: { label: 'Rejalashtirilgan', variant: 'info' as const },
  in_progress: { label: 'Jarayonda', variant: 'accent' as const },
  completed: { label: 'Bajarilgan', variant: 'success' as const },
  rejected: { label: 'Bekor qilingan', variant: 'danger' as const },
}

const COST_LABELS: Record<keyof ProductionCosts, string> = {
  material: 'Xomashyo (material)',
  labor: 'Mehnat (ish haqi)',
  energy: 'Energiya',
  logistics: 'Logistika',
  other: 'Boshqa xarajatlar',
}

const totalCost = (c: ProductionCosts) => Object.values(c).reduce((a, b) => a + b, 0)

export default function Production() {
  const { data, dispatch } = useData()
  const perm = usePerm()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detail, setDetail] = useState<ProductionOrder | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<ProductionOrder | null>(null)
  const [saving, setSaving] = useState(false)

  // form
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('100')
  const [status, setStatus] = useState<ProductionOrder['status']>('planned')
  const [costs, setCosts] = useState<ProductionCosts>({ material: 0, labor: 0, energy: 0, logistics: 0, other: 0 })
  const [materials, setMaterials] = useState<{ productId: string; qty: number }[]>([])
  const [formError, setFormError] = useState('')

  const rawMaterials = data.products.filter((p) => p.type === 'raw')
  const finished = data.products.filter((p) => p.type === 'finished')

  const rows = useMemo(() => {
    let list = [...data.production]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((p) => p.id.toLowerCase().includes(s) || (data.products.find((x) => x.id === p.productId)?.name.toLowerCase().includes(s) ?? false))
    }
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter)
    return list
  }, [data.production, data.products, search, statusFilter])

  const stats = {
    today: data.production.filter((p) => p.status === 'completed' && new Date(p.date).toDateString() === new Date().toDateString()).length,
    planned: data.production.filter((p) => p.status === 'planned').length,
    inProgress: data.production.filter((p) => p.status === 'in_progress').length,
    completed: data.production.filter((p) => p.status === 'completed').length,
    rejected: data.production.filter((p) => p.status === 'rejected').length,
  }

  const openNew = () => {
    setProductId(finished[0]?.id ?? '')
    setQty('100'); setStatus('planned')
    setCosts({ material: 0, labor: 0, energy: 0, logistics: 0, other: 0 })
    setMaterials(rawMaterials[0] ? [{ productId: rawMaterials[0].id, qty: 1 }] : [])
    setFormError('')
    setFormOpen(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) return setFormError('Mahsulotni tanlang.')
    if (Number(qty) < 1) return setFormError('Miqdorni kiriting.')
    setSaving(true)
    setTimeout(() => {
      dispatch({
        type: 'ADD_PRODUCTION',
        production: { productId, qty: Number(qty), status, costs, materials },
      })
      toast('success', 'Ishlab chiqarish buyrug‘i yaratildi.', `${qty} dona • ${formatCompact(totalCost(costs))} tannarx`)
      setSaving(false); setFormOpen(false)
    }, 600)
  }

  const setStatusOf = (p: ProductionOrder, s: ProductionOrder['status']) => {
    dispatch({ type: 'SET_PRODUCTION_STATUS', id: p.id, status: s })
    if (s === 'completed') {
      toast('success', 'Ishlab chiqarish bajarildi!', 'Tayyor mahsulot omborga kirdi, xomashyo sarflandi, tannarx yozildi')
    } else {
      toast('success', `Holat: ${STATUS_META[s].label}`, p.id)
    }
    setDetail(null)
  }

  const columns: Column<ProductionOrder>[] = [
    {
      key: 'id', header: 'Buyruq', sortValue: (p) => p.id,
      render: (p) => {
        const prod = data.products.find((x) => x.id === p.productId)
        return <div><p className="fw-6 fs-13 mono">{p.id}</p><p className="fs-11 text-3">{prod?.name}</p></div>
      },
    },
    { key: 'qty', header: 'Miqdor', align: 'right', sortValue: (p) => p.qty, render: (p) => <span className="mono fw-6 fs-13">{p.qty} <span className="text-3 fs-11">dona</span></span> },
    { key: 'cost', header: 'Tannarx', align: 'right', sortValue: (p) => totalCost(p.costs), render: (p) => <span className="mono fs-13 fw-6">{formatCompact(totalCost(p.costs))}</span> },
    { key: 'unit', header: 'Birlik narxi', align: 'right', sortValue: (p) => totalCost(p.costs) / p.qty, render: (p) => <span className="mono fs-12 text-2">{formatCompact(totalCost(p.costs) / p.qty)}</span> },
    { key: 'status', header: 'Holat', sortValue: (p) => p.status, render: (p) => <Badge variant={STATUS_META[p.status].variant}>{STATUS_META[p.status].label}</Badge> },
    { key: 'date', header: 'Sana', sortValue: (p) => p.date, render: (p) => <span className="fs-12 text-2 mono">{new Date(p.date).toLocaleDateString('uz')}</span> },
    {
      key: 'actions', header: '', align: 'right',
      render: (p) => (
        <div className="row-actions">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(p) }} aria-label="Ko‘rish"><Eye /></Button>
          {perm.can('production', 'edit') && p.status === 'planned' && (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setStatusOf(p, 'in_progress') }} aria-label="Boshlash"><Play /></Button>
          )}
          {perm.can('production', 'edit') && p.status === 'in_progress' && (
            <Button size="sm" variant="ghost" className="t-success" onClick={(e) => { e.stopPropagation(); setStatusOf(p, 'completed') }} aria-label="Bajarildi"><Check /></Button>
          )}
          {perm.can('production', 'delete') && <Button size="sm" variant="ghost" className="t-danger" onClick={(e) => { e.stopPropagation(); setDeleting(p) }} aria-label="O‘chirish"><Trash2 /></Button>}
        </div>
      ),
    },
  ]

  // tannarx calculator (standalone interactive panel)
  const [calcCosts, setCalcCosts] = useState<ProductionCosts>({ material: 5_400_000, labor: 1_800_000, energy: 600_000, logistics: 400_000, other: 200_000 })
  const [calcQty, setCalcQty] = useState('1000')
  const [calcPrice, setCalcPrice] = useState('11500')
  const calcTotal = totalCost(calcCosts)
  const calcUnit = Number(calcQty) > 0 ? calcTotal / Number(calcQty) : 0
  const calcMargin = Number(calcPrice) > 0 ? ((Number(calcPrice) - calcUnit) / Number(calcPrice)) * 100 : 0
  const calcProfit = (Number(calcPrice) - calcUnit) * Number(calcQty)

  return (
    <div className="page">
      <PageHeader
        title="Ishlab chiqarish"
        sub="Ishlab chiqarish buyruqlari, xomashyo sarfi va tannarx hisobi. Buyruq bajarilganda hammasi avtomatik sinxronlanadi."
        actions={perm.can('production', 'create') ? <Button size="sm" variant="primary" onClick={openNew}><Plus />Yangi buyruq</Button> : undefined}
      />

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {[
          { label: 'Bugun bajarildi', value: String(stats.today), sub: 'tayyor mahsulot' },
          { label: 'Rejalashtirilgan', value: String(stats.planned), sub: 'navbatda' },
          { label: 'Jarayonda', value: String(stats.inProgress), sub: 'ishlanmoqda' },
          { label: 'Bajarilgan', value: String(stats.completed), sub: 'omborga kirdi' },
          { label: 'Bekor qilingan', value: String(stats.rejected), sub: 'brak / bekor' },
        ].map((k) => (
          <div key={k.label} className="card kpi">
            <div className="kpi-icon"><Factory /></div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <span className="kpi-delta up">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row-between wrap mb-2" style={{ marginBottom: 16 }}>
          <p className="card-title">Ishlab chiqarish buyruqlari</p>
          <FilterChips value={statusFilter} onChange={setStatusFilter} options={[
            { key: 'all', label: 'Barchasi' }, { key: 'planned', label: 'Rejalashtirilgan' },
            { key: 'in_progress', label: 'Jarayonda' }, { key: 'completed', label: 'Bajarilgan' }, { key: 'rejected', label: 'Bekor' },
          ]} />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(p) => p.id}
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Buyruq ID yoki mahsulot..."
          onRowClick={(p) => setDetail(p)}
          mobileTitle={(p) => <span className="mono">{p.id}</span>}
          mobileSubtitle={(p) => data.products.find((x) => x.id === p.productId)?.name}
          placeholder={{ title: 'Ishlab chiqarish buyrug‘i yo‘q', text: 'Yangi buyruq yarating.', icon: <Factory /> }}
        />
      </div>

      {/* tannarx calculator */}
      <div className="grid-2 mt-3">
        <div className="card">
          <p className="card-title">Tannarx kalkulyatori</p>
          <p className="card-sub mb-2">Kirish qiymatlarini o‘zgartiring — hisob real vaqtda yangilanadi</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="grid-2">
              <Field label="Miqdor (dona)" required>
                <Input type="number" value={calcQty} onChange={(e) => setCalcQty(e.target.value)} min={1} />
              </Field>
              <Field label="Sotish narxi (so‘m/dona)" required>
                <Input type="number" value={calcPrice} onChange={(e) => setCalcPrice(e.target.value)} />
              </Field>
            </div>
            {(Object.keys(calcCosts) as (keyof ProductionCosts)[]).map((k) => (
              <Field key={k} label={COST_LABELS[k]}>
                <Input
                  type="number" value={calcCosts[k]}
                  onChange={(e) => setCalcCosts((c) => ({ ...c, [k]: Number(e.target.value) || 0 }))}
                />
              </Field>
            ))}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="card-title">Hisob natijasi</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, flex: 1 }}>
            <div className="stat-mini">
              <span className="text-2 fs-13">Jami tannarx</span>
              <span className="mono fw-7 font-display" style={{ fontSize: 17 }}>{formatUZS(calcTotal)}</span>
            </div>
            <div className="stat-mini">
              <span className="text-2 fs-13">Birlik tannarxi</span>
              <span className="mono fw-7 font-display" style={{ fontSize: 17 }}>{formatUZS(Math.round(calcUnit))}</span>
            </div>
            <div className="stat-mini">
              <span className="text-2 fs-13">Marja</span>
              <span className={`mono fw-7 font-display ${calcMargin >= 20 ? 't-success' : calcMargin > 0 ? 't-warning' : 't-danger'}`} style={{ fontSize: 17 }}>
                {calcMargin.toFixed(1)}%
              </span>
            </div>
            <div className="stat-mini" style={{ background: calcProfit >= 0 ? 'var(--success-soft)' : 'var(--danger-soft)', border: `1px solid ${calcProfit >= 0 ? 'rgba(52,211,153,.3)' : 'rgba(248,113,113,.3)'}` }}>
              <span className="text-2 fs-13">Umumiy foyda</span>
              <span className={`mono fw-7 font-display ${calcProfit >= 0 ? 't-success' : 't-danger'}`} style={{ fontSize: 17 }}>{formatUZS(Math.round(calcProfit))}</span>
            </div>
          </div>
          {calcMargin < 15 && calcMargin > 0 && (
            <div className="card mt-2" style={{ background: 'var(--warning-soft)', border: '1px solid rgba(251,191,36,.3)', padding: 13 }}>
              <p className="fs-12" style={{ lineHeight: 1.6 }}>
                <Zap style={{ width: 13, height: 13, display: 'inline', marginRight: 4, color: 'var(--warning)' }} />
                AI CFO: marja {calcMargin.toFixed(1)}% — past. Sotish narxini oshiring yoki xomashyo xarajatini optimallashtiring.
              </p>
            </div>
          )}
          {calcMargin <= 0 && (
            <div className="card mt-2" style={{ background: 'var(--danger-soft)', border: '1px solid rgba(248,113,113,.3)', padding: 13 }}>
              <p className="fs-12" style={{ lineHeight: 1.6 }}>
                <X style={{ width: 13, height: 13, display: 'inline', marginRight: 4, color: 'var(--danger)' }} />
                Zarar! Sotish narxi tannarxdan past. Narxni qayta ko‘rib chiqing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* raw materials overview */}
      <div className="card mt-3">
        <p className="card-title mb-2">Xomashyo zaxirasi</p>
        <div className="grid-4">
          {rawMaterials.map((m) => {
            const critical = m.stock <= m.minStock
            return (
              <div key={m.id} className="stat-mini" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <span className="fs-12 fw-6">{m.name}</span>
                <span className={`font-display fw-7 ${critical ? 't-danger' : ''}`} style={{ fontSize: 18 }}>{m.stock} <span className="fs-11 text-3">{m.unit}</span></span>
                <Badge variant={critical ? 'danger' : 'success'}>{critical ? 'Kritik' : 'Yetarli'}</Badge>
              </div>
            )
          })}
        </div>
      </div>

      {/* new production form */}
      <Modal
        open={formOpen} onClose={() => setFormOpen(false)}
        title="Yangi ishlab chiqarish buyrug‘i"
        subtitle="«Bajarilgan» holatida xomashyo sarflanadi, tayyor mahsulot omborga tushadi"
        size="lg"
        footer={
          <>
            <Button onClick={() => setFormOpen(false)}>Bekor qilish</Button>
            <Button variant="primary" loading={saving} onClick={submit as any}>Yaratish</Button>
          </>
        }
      >
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <Field label="Tayyor mahsulot" required>
              <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                {finished.map((p) => <option key={p.id} value={p.id}>{p.name} (omborda {p.stock})</option>)}
              </Select>
            </Field>
            <Field label="Miqdor (dona)" required>
              <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min={1} />
            </Field>
          </div>

          <Field label="Xomashyo sarfi">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {materials.map((m, idx) => (
                <div key={idx} className="row wrap" style={{ gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
                  <Select
                    value={m.productId}
                    onChange={(e) => setMaterials((arr) => arr.map((x, i) => (i === idx ? { ...x, productId: e.target.value } : x)))}
                    style={{ flex: '1 1 200px' }}
                  >
                    {rawMaterials.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.stock} {r.unit})</option>)}
                  </Select>
                  <Input type="number" min={1} value={m.qty} style={{ width: 110 }} onChange={(e) => setMaterials((arr) => arr.map((x, i) => (i === idx ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x)))} aria-label="Miqdor" />
                  <button type="button" className="modal-x" onClick={() => setMaterials((arr) => arr.filter((_, i) => i !== idx))} aria-label="O‘chirish"><X /></button>
                </div>
              ))}
              <Button size="sm" type="button" onClick={() => rawMaterials[0] && setMaterials((arr) => [...arr, { productId: rawMaterials[0].id, qty: 1 }])}>
                <Plus />Xomashyo qo‘shish
              </Button>
            </div>
          </Field>

          <div className="field">
            <label>Tannarx tarkibi (so‘m)</label>
            <div className="grid-2" style={{ gap: 10 }}>
              {(Object.keys(costs) as (keyof ProductionCosts)[]).map((k) => (
                <Field key={k} label={COST_LABELS[k]}>
                  <Input type="number" value={costs[k]} onChange={(e) => setCosts((c) => ({ ...c, [k]: Number(e.target.value) || 0 }))} />
                </Field>
              ))}
            </div>
          </div>

          <Field label="Boshlang‘ich holat">
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </Field>

          <div className="stat-mini" style={{ background: 'var(--accent-soft)', border: '1px solid rgba(139,92,246,.3)' }}>
            <span className="fs-13 text-2">Jami tannarx / birlik</span>
            <span className="font-display fw-7 mono" style={{ fontSize: 17 }}>
              {formatCompact(totalCost(costs))} / {formatCompact(Number(qty) > 0 ? totalCost(costs) / Number(qty) : 0)}
            </span>
          </div>
          {formError && <p className="field-error"><span>⚠</span>{formError}</p>}
        </form>
      </Modal>

      {/* detail */}
      <Drawer
        open={!!detail} onClose={() => setDetail(null)}
        title={`Buyruq ${detail?.id ?? ''}`}
        subtitle={detail ? data.products.find((p) => p.id === detail.productId)?.name : ''}
        footer={detail && perm.can('production', 'edit') && detail.status !== 'completed' && detail.status !== 'rejected' ? (
          <>
            <Button onClick={() => setStatusOf(detail, 'rejected')} className="t-danger">Bekor qilish</Button>
            {detail.status === 'planned'
              ? <Button variant="primary" onClick={() => setStatusOf(detail, 'in_progress')}><Play />Ishni boshlash</Button>
              : <Button variant="primary" onClick={() => setStatusOf(detail, 'completed')}><Check />Bajarildi deb belgilash</Button>}
          </>
        ) : undefined}
      >
        {detail && (
          <>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Holat</span><Badge variant={STATUS_META[detail.status].variant}>{STATUS_META[detail.status].label}</Badge></div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Miqdor</span><span className="mono fw-6">{detail.qty} dona</span></div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Sana</span><span className="fs-13 mono">{new Date(detail.date).toLocaleDateString('uz')}</span></div>

            <p className="card-title mt-3 mb-2">Tannarx tarkibi</p>
            {(Object.keys(detail.costs) as (keyof ProductionCosts)[]).map((k) => (
              <div key={k} className="stat-mini mb-1">
                <span className="text-2 fs-12">{COST_LABELS[k]}</span>
                <span className="mono fs-13 fw-6">{formatCompact(detail.costs[k])}</span>
              </div>
            ))}
            <div className="stat-mini mt-2" style={{ background: 'var(--accent-soft)', border: '1px solid rgba(139,92,246,.3)' }}>
              <span className="fs-13 text-2 fw-6">JAMI / birlik</span>
              <span className="mono fw-7 font-display">{formatCompact(totalCost(detail.costs))} / {formatCompact(totalCost(detail.costs) / detail.qty)}</span>
            </div>

            <p className="card-title mt-3 mb-2">Xomashyo sarfi</p>
            {detail.materials.length === 0 && <p className="fs-13 text-3 center" style={{ padding: 14 }}>Xomashyo belgilanmagan.</p>}
            {detail.materials.map((m, i) => {
              const rm = data.products.find((x) => x.id === m.productId)
              return (
                <div key={i} className="stat-mini mb-1">
                  <div><p className="fw-6 fs-12">{rm?.name}</p><p className="fs-11 text-3">omborda: {rm?.stock} {rm?.unit}</p></div>
                  <span className="mono fw-6 fs-13 t-danger">−{m.qty} {rm?.unit}</span>
                </div>
              )
            })}

            {detail.status === 'completed' && (
              <div className="card mt-3" style={{ background: 'var(--success-soft)', border: '1px solid rgba(52,211,153,.3)', padding: 14 }}>
                <p className="fs-12" style={{ lineHeight: 1.6 }}>
                  <Package style={{ width: 13, height: 13, display: 'inline', marginRight: 4, color: 'var(--success)' }} />
                  Bajarilgan: {detail.qty} dona tayyor mahsulot omborga kirdi, xomashyo sarflandi, tannarx xarajat sifatida yozildi.
                </p>
              </div>
            )}
          </>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Buyruqni o‘chirish"
        message={`${deleting?.id} o‘chiriladi. Agar bajarilgan bo‘lsa, ombor va moliyaviy yozuvlar qaytariladi.`}
        onConfirm={() => {
          if (!deleting) return
          dispatch({ type: 'DELETE_PRODUCTION', id: deleting.id })
          toast('delete', `Buyruq o‘chirildi: ${deleting.id}`)
          setDeleting(null)
        }}
      />

      <style>{`@media (max-width: 1280px) { .kpi-grid[style*="repeat(5"] { grid-template-columns: repeat(3, 1fr) !important; } } @media (max-width: 720px) { .kpi-grid[style*="repeat(5"] { grid-template-columns: 1fr 1fr !important; } }`}</style>
    </div>
  )
}
