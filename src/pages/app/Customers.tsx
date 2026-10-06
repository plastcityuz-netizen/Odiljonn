import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, Download, Eye, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useData } from '../../lib/store'
import { usePerm } from '../../components/layout/Guarded'
import { PageHeader } from '../../components/ui/PageHeader'
import { Avatar, Badge, Button, Field, Input, Select, Textarea } from '../../components/ui/primitives'
import { ConfirmDialog, Drawer, Modal } from '../../components/ui/modals'
import { DataTable, FilterChips, type Column } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/toast'
import { downloadCSV, formatCompact, formatUZS, timeAgo } from '../../lib/utils'
import { customerStats } from '../../lib/analytics'
import type { Customer } from '../../lib/types'

export default function Customers() {
  const { data, dispatch } = useData()
  const perm = usePerm()
  const { toast } = useToast()
  const [params] = useSearchParams()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [detail, setDetail] = useState<Customer | null>(params.get('id') ? data.customers.find((c) => c.id === params.get('id')) ?? null : null)
  const [formOpen, setFormOpen] = useState(false)
  const [editCus, setEditCus] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)

  // form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [type, setType] = useState<'individual' | 'business'>('individual')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const rowsWithStats = useMemo(
    () => data.customers.map((c) => ({ ...c, stats: customerStats(c.id, data) })),
    [data]
  )

  const rows = useMemo(() => {
    let list = rowsWithStats
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.company.toLowerCase().includes(s))
    }
    if (typeFilter !== 'all') list = list.filter((c) => c.type === typeFilter)
    return list
  }, [rowsWithStats, search, typeFilter])

  const openNew = () => {
    setEditCus(null); setName(''); setPhone(''); setCompany(''); setType('individual'); setNotes(''); setErrors({})
    setFormOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditCus(c); setName(c.name); setPhone(c.phone); setCompany(c.company); setType(c.type); setNotes(c.notes); setErrors({})
    setFormOpen(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (name.trim().length < 2) errs.name = 'Ismni kiriting.'
    if (!/^[+\d\s()-]{7,}$/.test(phone.trim())) errs.phone = 'Telefon raqamini kiriting.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    setTimeout(() => {
      if (editCus) {
        dispatch({ type: 'UPDATE_CUSTOMER', customer: { ...editCus, name: name.trim(), phone: phone.trim(), company: company.trim() || '—', type, notes } })
        toast('success', 'Mijoz yangilandi.', name)
      } else {
        dispatch({ type: 'ADD_CUSTOMER', customer: { name: name.trim(), phone: phone.trim(), company: company.trim() || '—', type, notes } })
        toast('success', 'Yangi mijoz qo‘shildi.', name)
      }
      setSaving(false); setFormOpen(false)
    }, 600)
  }

  const columns: Column<typeof rows[number]>[] = [
    {
      key: 'name', header: 'Mijoz', sortValue: (c) => c.name,
      render: (c) => (
        <div className="row" style={{ gap: 10 }}>
          <Avatar name={c.name} size={30} />
          <div><p className="fw-6 fs-13">{c.name}</p><p className="fs-11 text-3">{c.company !== '—' ? c.company : c.type === 'business' ? 'Biznes' : 'Jismoniy shaxs'}</p></div>
        </div>
      ),
    },
    { key: 'phone', header: 'Telefon', render: (c) => <span className="fs-13 mono text-2">{c.phone}</span> },
    { key: 'type', header: 'Turi', sortValue: (c) => c.type, render: (c) => <Badge variant={c.type === 'business' ? 'info' : 'neutral'}>{c.type === 'business' ? 'Biznes' : 'Jismoniy'}</Badge> },
    { key: 'orders', header: 'Buyurtma', align: 'right', sortValue: (c) => c.stats.ordersCount, render: (c) => <span className="mono fw-6 fs-13">{c.stats.ordersCount}</span> },
    { key: 'total', header: 'Jami xarid', align: 'right', sortValue: (c) => c.stats.totalPurchases, render: (c) => <span className="mono fw-6 fs-13">{formatCompact(c.stats.totalPurchases)}</span> },
    {
      key: 'debt', header: 'Qarz', align: 'right', sortValue: (c) => c.stats.debt,
      render: (c) => c.stats.debt > 0 ? <span className="mono fw-6 fs-13 t-danger">{formatCompact(c.stats.debt)}</span> : <span className="fs-13 text-3">—</span>,
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (c) => (
        <div className="row-actions">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(c) }} aria-label="Ko‘rish"><Eye /></Button>
          {perm.can('customers', 'edit') && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(c) }} aria-label="Tahrirlash"><Pencil /></Button>}
          {perm.can('customers', 'delete') && <Button size="sm" variant="ghost" className="t-danger" onClick={(e) => { e.stopPropagation(); setDeleting(c) }} aria-label="O‘chirish"><Trash2 /></Button>}
        </div>
      ),
    },
  ]

  const totalDebt = rowsWithStats.reduce((s, c) => s + c.stats.debt, 0)
  const topCustomer = [...rowsWithStats].sort((a, b) => b.stats.totalPurchases - a.stats.totalPurchases)[0]

  return (
    <div className="page">
      <PageHeader
        title="Mijozlar"
        sub="Mijozlar bazasi, xarid tarixi va qarzlari — savdo moduli bilan real vaqtda sinxron."
        actions={
          <>
            {perm.can('customers', 'export') && (
              <Button size="sm" onClick={() => {
                downloadCSV('mijozlar.csv', [['Ism', 'Telefon', 'Kompaniya', 'Buyurtmalar', 'Jami xarid', 'Qarz'], ...rows.map((c) => [c.name, c.phone, c.company, c.stats.ordersCount, c.stats.totalPurchases, c.stats.debt])])
                toast('success', 'Eksport tayyor.', 'mijozlar.csv yuklab olindi')
              }}><Download />Export</Button>
            )}
            {perm.can('customers', 'create') && <Button size="sm" variant="primary" onClick={openNew}><Plus />Yangi mijoz</Button>}
          </>
        }
      />

      <div className="kpi-grid">
        {[
          { label: 'Jami mijozlar', value: String(data.customers.length), sub: 'faol baza' },
          { label: 'Biznes mijozlar', value: String(data.customers.filter((c) => c.type === 'business').length), sub: 'yuridik shaxs' },
          { label: 'Jami qarzlar', value: formatCompact(totalDebt), sub: 'debitorlar' },
          { label: 'Eng faol mijoz', value: topCustomer ? topCustomer.name.split(' ')[0] : '—', sub: topCustomer ? formatCompact(topCustomer.stats.totalPurchases) : '' },
        ].map((k) => (
          <div key={k.label} className="card kpi">
            <div className="kpi-icon"><Users /></div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={k.label === 'Eng faol mijoz' ? { fontSize: 18 } : undefined}>{k.value}</div>
            <span className="kpi-delta up">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row-between wrap mb-2" style={{ marginBottom: 16 }}>
          <p className="card-title">Mijozlar ro‘yxati</p>
          <FilterChips value={typeFilter} onChange={setTypeFilter} options={[{ key: 'all', label: 'Barchasi' }, { key: 'business', label: 'Biznes' }, { key: 'individual', label: 'Jismoniy' }]} />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Ism, telefon yoki kompaniya..."
          onRowClick={(c) => setDetail(c)}
          mobileTitle={(c) => c.name}
          mobileSubtitle={(c) => `${c.phone} • ${c.stats.ordersCount} buyurtma`}
          placeholder={{ title: 'Mijoz topilmadi', text: 'Yangi mijoz qo‘shing yoki qidiruvni o‘zgartiring.', icon: <Users /> }}
        />
      </div>

      {/* form */}
      <Modal
        open={formOpen} onClose={() => setFormOpen(false)}
        title={editCus ? 'Mijozni tahrirlash' : 'Yangi mijoz'}
        footer={
          <>
            <Button onClick={() => setFormOpen(false)}>Bekor qilish</Button>
            <Button variant="primary" loading={saving} onClick={submit as any}>{editCus ? 'Saqlash' : 'Qo‘shish'}</Button>
          </>
        }
      >
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Ism yoki tashkilot nomi" required error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Global Office MChJ" invalid={!!errors.name} />
          </Field>
          <div className="grid-2">
            <Field label="Telefon" required error={errors.phone}>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123-45-67" invalid={!!errors.phone} />
            </Field>
            <Field label="Kompaniya">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="—" />
            </Field>
          </div>
          <Field label="Mijoz turi" required>
            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="individual">Jismoniy shaxs</option>
              <option value="business">Biznes (yuridik shaxs)</option>
            </Select>
          </Field>
          <Field label="Izoh">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mijoz haqida qo‘shimcha ma’lumot..." />
          </Field>
        </form>
      </Modal>

      {/* detail */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} subtitle={detail?.company}>
        {detail && (() => {
          const stats = customerStats(detail.id, data)
          return (
            <>
              <div className="row mb-2" style={{ gap: 12 }}>
                <Avatar name={detail.name} size={52} />
                <div>
                  <p className="fw-6 fs-14">{detail.name}</p>
                  <p className="fs-12 text-3 mono">{detail.phone}</p>
                  <Badge variant={detail.type === 'business' ? 'info' : 'neutral'}>{detail.type === 'business' ? 'Biznes' : 'Jismoniy shaxs'}</Badge>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div className="stat-mini" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                  <span className="fs-11 text-3">Buyurtmalar</span>
                  <span className="font-display fw-7" style={{ fontSize: 19 }}>{stats.ordersCount}</span>
                </div>
                <div className="stat-mini" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                  <span className="fs-11 text-3">Jami xarid</span>
                  <span className="font-display fw-7" style={{ fontSize: 19 }}>{formatCompact(stats.totalPurchases)}</span>
                </div>
              </div>
              <div className="stat-mini mt-2" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3, border: stats.debt > 0 ? '1px solid rgba(248,113,113,.35)' : undefined }}>
                <span className="fs-11 text-3">Joriy qarz</span>
                <span className={`font-display fw-7 ${stats.debt > 0 ? 't-danger' : 't-success'}`} style={{ fontSize: 19 }}>{formatCompact(stats.debt)}</span>
              </div>

              {detail.notes && (
                <div className="card mt-2" style={{ background: 'var(--surface)', boxShadow: 'none', padding: 14 }}>
                  <p className="fs-11 text-3 fw-6" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Izoh</p>
                  <p className="fs-13 text-2 mt-1" style={{ lineHeight: 1.6 }}>{detail.notes}</p>
                </div>
              )}

              <p className="card-title mt-3 mb-2">Xarid tarixi</p>
              {stats.orders.length === 0 && <p className="fs-13 text-3 center" style={{ padding: 18 }}>Hali buyurtma yo‘q.</p>}
              {stats.orders.map((o) => (
                <div key={o.id} className="stat-mini mb-1">
                  <div>
                    <p className="fw-6 fs-13 mono">{o.id}</p>
                    <p className="fs-11 text-3">{timeAgo(o.date)} • {o.items.length} pozitsiya</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="mono fw-6 fs-13">{formatCompact(o.amount)}</p>
                    <Badge variant={o.payment === 'paid' ? 'success' : o.payment === 'partial' ? 'warning' : 'danger'}>
                      {o.payment === 'paid' ? 'To‘langan' : o.payment === 'partial' ? 'Qismiy' : 'Qarz'}
                    </Badge>
                  </div>
                </div>
              ))}

              <p className="card-title mt-3 mb-2">To‘lovlar</p>
              {data.payments.filter((p) => stats.orders.some((o) => o.id === p.debtId)).length === 0 && (
                <p className="fs-13 text-3 center" style={{ padding: 18 }}>To‘lovlar tarixi bo‘sh.</p>
              )}
              {data.payments.filter((p) => stats.orders.some((o) => o.id === p.debtId)).map((p) => (
                <div key={p.id} className="stat-mini mb-1">
                  <span className="fs-12 text-2">{timeAgo(p.date)}</span>
                  <span className="mono fw-6 t-success fs-13">+{formatCompact(p.amount)}</span>
                </div>
              ))}
            </>
          )
        })()}
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Mijozni o‘chirish"
        message={`${deleting?.name} bazadan o‘chiriladi. Buyurtmalari saqlanib qoladi. Davom etasizmi?`}
        onConfirm={() => {
          if (!deleting) return
          dispatch({ type: 'DELETE_CUSTOMER', id: deleting.id })
          toast('delete', `Mijoz o‘chirildi: ${deleting.name}`)
          setDeleting(null)
        }}
      />
    </div>
  )
}
