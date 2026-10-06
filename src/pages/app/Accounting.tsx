import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownCircle, ArrowUpCircle, Download, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { useData } from '../../lib/store'
import { usePerm } from '../../components/layout/Guarded'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Field, Input, Select } from '../../components/ui/primitives'
import { ConfirmDialog, Modal } from '../../components/ui/modals'
import { DataTable, FilterChips, type Column } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/toast'
import { downloadCSV, formatCompact, formatUZS } from '../../lib/utils'
import { monthExpense, monthIncome } from '../../lib/analytics'
import type { Transaction } from '../../lib/types'

const INCOME_CATEGORIES = ['Savdo tushumi', 'Boshqa daromad', 'Xizmat haqi', 'Protsent daromadi']
const EXPENSE_CATEGORIES = ['Xomashyo xaridi', 'Ish haqi', 'Ijara', 'Logistika', 'Marketing', 'Kommunal xarajatlar', 'Soliqlar va to‘lovlar', 'Ishlab chiqarish xarajati', 'Boshqa xarajat']

export default function Accounting() {
  const { data, dispatch } = useData()
  const perm = usePerm()
  const { toast } = useToast()
  const [params] = useSearchParams()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [formOpen, setFormOpen] = useState<null | 'income' | 'expense'>(params.get('new') === 'expense' ? 'expense' : null)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [saving, setSaving] = useState(false)

  // form
  const [trxDate, setTrxDate] = useState(new Date().toISOString().slice(0, 10))
  const [trxCategory, setTrxCategory] = useState(INCOME_CATEGORIES[0])
  const [trxDesc, setTrxDesc] = useState('')
  const [trxAmount, setTrxAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const inc = monthIncome(data.transactions)
  const exp = monthExpense(data.transactions)
  const balance = data.transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)

  const rows = useMemo(() => {
    let list = [...data.transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date))
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((t) => t.description.toLowerCase().includes(s) || t.category.toLowerCase().includes(s))
    }
    if (typeFilter !== 'all') list = list.filter((t) => t.type === typeFilter)
    return list
  }, [data.transactions, search, typeFilter])

  const openForm = (kind: 'income' | 'expense', trx?: Transaction) => {
    setEditing(trx ?? null)
    setFormOpen(kind)
    setTrxCategory(trx ? trx.category : kind === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
    setTrxDesc(trx?.description ?? '')
    setTrxAmount(trx ? String(trx.amount) : '')
    setTrxDate((trx ? new Date(trx.date) : new Date()).toISOString().slice(0, 10))
    setErrors({})
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const kind = formOpen ?? 'income'
    const errs: Record<string, string> = {}
    if (trxDesc.trim().length < 2) errs.desc = 'Tavsifni kiriting.'
    if (!Number(trxAmount) || Number(trxAmount) <= 0) errs.amount = 'Summani kiriting.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    setTimeout(() => {
      const payload = {
        date: new Date(trxDate).toISOString(),
        type: kind as 'income' | 'expense',
        category: trxCategory,
        description: trxDesc.trim(),
        amount: Number(trxAmount),
      }
      if (editing) {
        dispatch({ type: 'UPDATE_TRANSACTION', trx: { ...payload, id: editing.id } })
        toast('success', 'Tranzaksiya yangilandi.')
      } else {
        dispatch({ type: 'ADD_TRANSACTION', trx: payload })
        toast('success', kind === 'income' ? 'Daromad qo‘shildi.' : 'Xarajat qo‘shildi.', `${trxCategory} — ${formatUZS(Number(trxAmount))}`)
      }
      setSaving(false); setFormOpen(null)
    }, 550)
  }

  // running balance for table
  let running = balance
  const withBalance = rows.map((t) => {
    const row = { ...t, balance: running }
    running -= t.type === 'income' ? t.amount : -t.amount
    return row
  })

  const columns: Column<typeof withBalance[number]>[] = [
    { key: 'date', header: 'Sana', sortValue: (t) => t.date, render: (t) => <span className="fs-12 mono text-2">{new Date(t.date).toLocaleDateString('uz')}</span> },
    {
      key: 'type', header: 'Turi', sortValue: (t) => t.type,
      render: (t) => <Badge variant={t.type === 'income' ? 'success' : 'danger'}>{t.type === 'income' ? 'Daromad' : 'Xarajat'}</Badge>,
    },
    { key: 'category', header: 'Toifa', sortValue: (t) => t.category, render: (t) => <span className="fs-12 text-2">{t.category}</span> },
    {
      key: 'desc', header: 'Tavsif', sortValue: (t) => t.description,
      render: (t) => <span className="fs-13 fw-6" style={{ maxWidth: 280, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</span>,
    },
    {
      key: 'income', header: 'Daromad', align: 'right', sortValue: (t) => (t.type === 'income' ? t.amount : 0),
      render: (t) => t.type === 'income' ? <span className="mono fs-13 t-success fw-6">{formatCompact(t.amount)}</span> : <span className="text-3">—</span>,
    },
    {
      key: 'expense', header: 'Xarajat', align: 'right', sortValue: (t) => (t.type === 'expense' ? t.amount : 0),
      render: (t) => t.type === 'expense' ? <span className="mono fs-13 t-danger fw-6">{formatCompact(t.amount)}</span> : <span className="text-3">—</span>,
    },
    { key: 'balance', header: 'Balans', align: 'right', sortValue: (t) => t.balance, render: (t) => <span className="mono fs-12 fw-6">{formatCompact(t.balance)}</span> },
    {
      key: 'actions', header: '', align: 'right',
      render: (t) => (
        <div className="row-actions">
          {t.ref ? <Badge variant="neutral" style={{ fontSize: 9 }}>avto</Badge> : (
            <>
              {perm.can('accounting', 'edit') && <Button size="sm" variant="ghost" onClick={() => openForm(t.type, t)} aria-label="Tahrirlash"><Pencil /></Button>}
              {perm.can('accounting', 'delete') && <Button size="sm" variant="ghost" className="t-danger" onClick={() => setDeleting(t)} aria-label="O‘chirish"><Trash2 /></Button>}
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Buxgalteriya"
        sub="Daromad va xarajatlar jurnali. Savdo, xarid va ishlab chiqarishdan yozuvlar avtomatik tushadi."
        actions={
          <>
            {perm.can('accounting', 'export') && (
              <Button size="sm" onClick={() => {
                downloadCSV('buxgalteriya.csv', [['Sana', 'Turi', 'Toifa', 'Tavsif', 'Summa'], ...rows.map((t) => [new Date(t.date).toLocaleDateString('uz'), t.type === 'income' ? 'Daromad' : 'Xarajat', t.category, t.description, t.amount])])
                toast('success', 'Eksport tayyor.', 'buxgalteriya.csv yuklab olindi')
              }}><Download />Export</Button>
            )}
            {perm.can('accounting', 'create') && (
              <>
                <Button size="sm" onClick={() => openForm('income')}><Plus />Daromad</Button>
                <Button size="sm" variant="primary" onClick={() => openForm('expense')}><Plus />Xarajat</Button>
              </>
            )}
          </>
        }
      />

      <div className="kpi-grid">
        {[
          { label: 'Bu oy daromad', value: formatCompact(inc), cls: 't-success' },
          { label: 'Bu oy xarajat', value: formatCompact(exp), cls: 't-danger' },
          { label: 'Jami balans', value: formatCompact(balance), cls: '' },
          { label: 'Sof foyda (oy)', value: formatCompact(inc - exp), cls: inc - exp >= 0 ? 't-success' : 't-danger' },
        ].map((k) => (
          <div key={k.label} className="card kpi">
            <div className="kpi-icon" style={k.cls === 't-success' ? { background: 'var(--success-soft)', color: 'var(--success)' } : k.cls === 't-danger' ? { background: 'var(--danger-soft)', color: 'var(--danger)' } : undefined}>
              {k.cls === 't-success' ? <ArrowUpCircle /> : k.cls === 't-danger' ? <ArrowDownCircle /> : <Wallet />}
            </div>
            <div className="kpi-label">{k.label}</div>
            <div className={`kpi-value ${k.cls}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row-between wrap mb-2" style={{ marginBottom: 16 }}>
          <p className="card-title">Tranzaksiyalar jurnali</p>
          <FilterChips value={typeFilter} onChange={setTypeFilter} options={[
            { key: 'all', label: 'Barchasi' }, { key: 'income', label: 'Daromadlar' }, { key: 'expense', label: 'Xarajatlar' },
          ]} />
        </div>
        <DataTable
          columns={columns}
          rows={withBalance}
          rowKey={(t) => t.id}
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Tavsif yoki toifa..."
          pageSize={12}
          mobileTitle={(t) => t.description}
          mobileSubtitle={(t) => `${t.category} • ${formatCompact(t.amount)}`}
          placeholder={{ title: 'Tranzaksiya topilmadi', text: 'Daromad yoki xarajat qo‘shing.', icon: <Wallet /> }}
        />
      </div>

      <Modal
        open={!!formOpen} onClose={() => setFormOpen(null)}
        title={editing ? 'Tranzaksiyani tahrirlash' : formOpen === 'income' ? 'Daromad qo‘shish' : 'Xarajat qo‘shish'}
        footer={
          <>
            <Button onClick={() => setFormOpen(null)}>Bekor qilish</Button>
            <Button variant="primary" loading={saving} onClick={submit as any}>{editing ? 'Saqlash' : 'Qo‘shish'}</Button>
          </>
        }
      >
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div className="grid-2">
            <Field label="Sana" required>
              <Input type="date" value={trxDate} onChange={(e) => setTrxDate(e.target.value)} />
            </Field>
            <Field label="Toifa" required>
              <Select value={trxCategory} onChange={(e) => setTrxCategory(e.target.value)}>
                {(formOpen === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Tavsif" required error={errors.desc}>
            <Input value={trxDesc} onChange={(e) => setTrxDesc(e.target.value)} placeholder="Masalan: Ombor ijarasi — oktabr" invalid={!!errors.desc} />
          </Field>
          <Field label="Summa (so‘m)" required error={errors.amount}>
            <Input type="number" value={trxAmount} onChange={(e) => setTrxAmount(e.target.value)} placeholder="0" invalid={!!errors.amount} />
          </Field>
          <div className="stat-mini">
            <span className="text-2 fs-13">Yoziladi</span>
            <span className={`mono fw-6 ${formOpen === 'income' ? 't-success' : 't-danger'}`}>
              {formOpen === 'income' ? '+' : '−'}{formatCompact(Number(trxAmount) || 0)}
            </span>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Tranzaksiyani o‘chirish"
        message={`«${deleting?.description}» o‘chiriladi va balansdan yo‘qoladi. Davom etasizmi?`}
        onConfirm={() => {
          if (!deleting) return
          dispatch({ type: 'DELETE_TRANSACTION', id: deleting.id })
          toast('delete', 'Tranzaksiya o‘chirildi.')
          setDeleting(null)
        }}
      />
    </div>
  )
}
