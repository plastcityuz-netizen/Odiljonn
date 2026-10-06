import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarCheck, Download, Eye, Pencil, Plus, Trash2, UserCog, Users, Wallet } from 'lucide-react'
import { useData } from '../../lib/store'
import { usePerm } from '../../components/layout/Guarded'
import { PageHeader } from '../../components/ui/PageHeader'
import { Avatar, Badge, Button, Field, Input, Select } from '../../components/ui/primitives'
import { ConfirmDialog, Drawer, Modal } from '../../components/ui/modals'
import { DataTable, FilterChips, type Column } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/toast'
import { downloadCSV, formatCompact, formatDate, formatUZS } from '../../lib/utils'
import type { Employee } from '../../lib/types'

const DEPARTMENTS = ['Boshqaruv', 'Savdo', 'Moliya', 'Ombor', 'Ishlab chiqarish', 'HR', 'Marketing', 'Logistika']
const STATUS_LABEL = { active: 'Faol', leave: 'Ta’tilda', inactive: 'Nofaol' } as const
const STATUS_VARIANT = { active: 'success', leave: 'warning', inactive: 'danger' } as const

export default function HR() {
  const { data, dispatch } = useData()
  const perm = usePerm()
  const { toast } = useToast()
  const [params] = useSearchParams()

  const [tab, setTab] = useState<'employees' | 'attendance' | 'payroll' | 'leave'>('employees')
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [detail, setDetail] = useState<Employee | null>(params.get('id') ? data.employees.find((e) => e.id === params.get('id')) ?? null : null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)
  const [saving, setSaving] = useState(false)
  const [payrollOpen, setPayrollOpen] = useState(false)
  const [paying, setPaying] = useState(false)

  // form
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [department, setDepartment] = useState(DEPARTMENTS[1])
  const [phone, setPhone] = useState('')
  const [salary, setSalary] = useState('')
  const [status, setStatus] = useState<Employee['status']>('active')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalSalary = data.employees.filter((e) => e.status !== 'inactive').reduce((s, e) => s + e.salary, 0)

  const rows = useMemo(() => {
    let list = [...data.employees]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((e) => e.name.toLowerCase().includes(s) || e.position.toLowerCase().includes(s))
    }
    if (deptFilter !== 'all') list = list.filter((e) => e.department === deptFilter)
    return list
  }, [data.employees, search, deptFilter])

  const openNew = () => {
    setEditing(null); setName(''); setPosition(''); setDepartment(DEPARTMENTS[1]); setPhone(''); setSalary(''); setStatus('active'); setErrors({})
    setFormOpen(true)
  }

  const openEdit = (e: Employee) => {
    setEditing(e); setName(e.name); setPosition(e.position); setDepartment(e.department); setPhone(e.phone); setSalary(String(e.salary)); setStatus(e.status); setErrors({})
    setFormOpen(true)
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const errs: Record<string, string> = {}
    if (name.trim().length < 3) errs.name = 'To‘liq ism kiriting.'
    if (position.trim().length < 2) errs.position = 'Lavozimni kiriting.'
    if (!/^[+\d\s()-]{7,}$/.test(phone)) errs.phone = 'Telefon kiriting.'
    if (!Number(salary)) errs.salary = 'Ish haqini kiriting.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    setTimeout(() => {
      if (editing) {
        dispatch({ type: 'UPDATE_EMPLOYEE', employee: { ...editing, name: name.trim(), position: position.trim(), department, phone, salary: Number(salary), status } })
        toast('success', 'Xodim ma’lumotlari yangilandi.', name)
      } else {
        dispatch({ type: 'ADD_EMPLOYEE', employee: { name: name.trim(), position: position.trim(), department, phone, salary: Number(salary), status, performance: 70 } })
        toast('success', 'Yangi xodim qo‘shildi.', `${name} — ${position}`)
      }
      setSaving(false); setFormOpen(false)
    }, 600)
  }

  const columns: Column<Employee>[] = [
    {
      key: 'name', header: 'Xodim', sortValue: (e) => e.name,
      render: (e) => (
        <div className="row" style={{ gap: 10 }}>
          <Avatar name={e.name} size={30} />
          <div><p className="fw-6 fs-13">{e.name}</p><p className="fs-11 text-3">{e.position}</p></div>
        </div>
      ),
    },
    { key: 'dept', header: 'Bo‘lim', sortValue: (e) => e.department, render: (e) => <Badge variant="neutral">{e.department}</Badge> },
    { key: 'phone', header: 'Telefon', render: (e) => <span className="fs-12 mono text-2">{e.phone}</span> },
    { key: 'salary', header: 'Ish haqi', align: 'right', sortValue: (e) => e.salary, render: (e) => <span className="mono fs-13 fw-6">{formatCompact(e.salary)}</span> },
    {
      key: 'perf', header: 'Samara', align: 'right', sortValue: (e) => e.performance,
      render: (e) => (
        <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
          <div className="progress-track" style={{ width: 54 }}><div className="progress-fill" style={{ width: `${e.performance}%` }} /></div>
          <span className="mono fs-12">{e.performance}%</span>
        </div>
      ),
    },
    { key: 'status', header: 'Holat', sortValue: (e) => e.status, render: (e) => <Badge variant={STATUS_VARIANT[e.status]}>{STATUS_LABEL[e.status]}</Badge> },
    {
      key: 'actions', header: '', align: 'right',
      render: (e) => (
        <div className="row-actions">
          <Button size="sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); setDetail(e) }} aria-label="Ko‘rish"><Eye /></Button>
          {perm.can('hr', 'edit') && <Button size="sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); openEdit(e) }} aria-label="Tahrirlash"><Pencil /></Button>}
          {perm.can('hr', 'delete') && <Button size="sm" variant="ghost" className="t-danger" onClick={(ev) => { ev.stopPropagation(); setDeleting(e) }} aria-label="O‘chirish"><Trash2 /></Button>}
        </div>
      ),
    },
  ]

  return (
    <div className="page">
      <PageHeader
        title="HR"
        sub="Xodimlar, bo‘limlar, davomat, ish haqi va samaradorlik."
        actions={
          <>
            {perm.can('hr', 'export') && (
              <Button size="sm" onClick={() => {
                downloadCSV('xodimlar.csv', [['Ism', 'Lavozim', 'Bo‘lim', 'Telefon', 'Ish haqi', 'Holat'], ...rows.map((e) => [e.name, e.position, e.department, e.phone, e.salary, STATUS_LABEL[e.status]])])
                toast('success', 'Eksport tayyor.', 'xodimlar.csv yuklab olindi')
              }}><Download />Export</Button>
            )}
            {perm.can('hr', 'create') && <Button size="sm" variant="primary" onClick={openNew}><Plus />Yangi xodim</Button>}
          </>
        }
      />

      <div className="kpi-grid">
        {[
          { label: 'Jami xodimlar', value: String(data.employees.length), sub: `${data.employees.filter((e) => e.status === 'active').length} faol` },
          { label: 'Bo‘limlar', value: String(new Set(data.employees.map((e) => e.department)).size), sub: 'tuzilma' },
          { label: 'Oylik ish haqi fondi', value: formatCompact(totalSalary), sub: 'faol xodimlar' },
          { label: "O'rtacha samara", value: `${Math.round(data.employees.reduce((s, e) => s + e.performance, 0) / Math.max(1, data.employees.length))}%`, sub: 'performance' },
        ].map((k) => (
          <div key={k.label} className="card kpi">
            <div className="kpi-icon"><Users /></div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <span className="kpi-delta up">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row-between wrap mb-2" style={{ marginBottom: 16 }}>
          <div className="tabs">
            <button className={`tab ${tab === 'employees' ? 'active' : ''}`} onClick={() => setTab('employees')}><Users />Xodimlar</button>
            <button className={`tab ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}><CalendarCheck />Davomat</button>
            <button className={`tab ${tab === 'payroll' ? 'active' : ''}`} onClick={() => setTab('payroll')}><Wallet />Ish haqi</button>
            <button className={`tab ${tab === 'leave' ? 'active' : ''}`} onClick={() => setTab('leave')}><UserCog />Ta’til</button>
          </div>
          {tab === 'employees' && (
            <FilterChips value={deptFilter} onChange={setDeptFilter} options={[
              { key: 'all', label: 'Barchasi' }, ...DEPARTMENTS.map((d) => ({ key: d, label: d })),
            ]} />
          )}
          {tab === 'payroll' && perm.can('hr', 'edit') && (
            <Button size="sm" variant="primary" onClick={() => setPayrollOpen(true)}>Ish haqini to‘lash ({formatCompact(totalSalary)})</Button>
          )}
        </div>

        {tab === 'employees' && (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(e) => e.id}
            searchValue={search}
            onSearch={setSearch}
            searchPlaceholder="Ism yoki lavozim..."
            onRowClick={(e) => setDetail(e)}
            mobileTitle={(e) => e.name}
            mobileSubtitle={(e) => `${e.position} • ${e.department}`}
            placeholder={{ title: 'Xodim topilmadi', text: 'Yangi xodim qo‘shing.', icon: <Users /> }}
          />
        )}

        {tab === 'attendance' && (
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Xodim</th><th>Bo‘lim</th><th>Bugun</th><th>Bu oy (kun)</th><th>Kechikish</th><th>Holat</th></tr></thead>
              <tbody>
                {data.employees.map((e, i) => {
                  const present = e.status === 'active'
                  const days = e.status === 'active' ? 20 + ((i * 3) % 4) : e.status === 'leave' ? 0 : 8 + (i % 5)
                  const late = (i * 7) % 5
                  return (
                    <tr key={e.id}>
                      <td><div className="row" style={{ gap: 9 }}><Avatar name={e.name} size={26} /><span className="fw-6 fs-13">{e.name}</span></div></td>
                      <td><Badge variant="neutral">{e.department}</Badge></td>
                      <td>{present ? <Badge variant="success">Kelgan</Badge> : e.status === 'leave' ? <Badge variant="warning">Ta’tilda</Badge> : <Badge variant="danger">Yo‘q</Badge>}</td>
                      <td className="mono fw-6">{days} / 22</td>
                      <td className="mono">{late} marta</td>
                      <td><Badge variant={days >= 20 ? 'success' : days >= 10 ? 'warning' : 'danger'}>{days >= 20 ? 'A’lo' : days >= 10 ? 'O‘rtacha' : 'Past'}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="table-cards">
              {data.employees.map((e, i) => (
                <div key={e.id} className="table-card-item">
                  <div className="table-card-row"><span className="table-card-label">Xodim</span><span className="fw-6 fs-13">{e.name}</span></div>
                  <div className="table-card-row"><span className="table-card-label">Bu oy</span><span>{e.status === 'active' ? 20 + ((i * 3) % 4) : 0} / 22 kun</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'payroll' && (
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Xodim</th><th>Lavozim</th><th>Ish haqi</th><th className="right">Summa</th><th>Holat</th></tr></thead>
              <tbody>
                {data.employees.filter((e) => e.status !== 'inactive').map((e) => (
                  <tr key={e.id}>
                    <td><div className="row" style={{ gap: 9 }}><Avatar name={e.name} size={26} /><span className="fw-6 fs-13">{e.name}</span></div></td>
                    <td className="fs-12 text-2">{e.position}</td>
                    <td><Badge variant="neutral">{e.department}</Badge></td>
                    <td className="right mono fw-6">{formatUZS(e.salary)}</td>
                    <td><Badge variant="success">To‘lanadi</Badge></td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--accent-soft)' }}>
                  <td colSpan={3} className="fw-7 fs-13">JAMI — {data.employees.filter((e) => e.status !== 'inactive').length} xodim</td>
                  <td className="right mono fw-7 t-accent">{formatUZS(totalSalary)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
            <div className="table-cards">
              {data.employees.filter((e) => e.status !== 'inactive').map((e) => (
                <div key={e.id} className="table-card-item">
                  <div className="table-card-row"><span className="table-card-label">Xodim</span><span className="fw-6 fs-13">{e.name}</span></div>
                  <div className="table-card-row"><span className="table-card-label">Ish haqi</span><span className="mono fw-6">{formatUZS(e.salary)}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'leave' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.employees.filter((e) => e.status === 'leave').map((e) => (
              <div key={e.id} className="stat-mini">
                <div className="row" style={{ gap: 10 }}>
                  <Avatar name={e.name} size={32} />
                  <div><p className="fw-6 fs-13">{e.name}</p><p className="fs-11 text-3">{e.position}</p></div>
                </div>
                <Badge variant="warning">Ta’tilda — yillik</Badge>
              </div>
            ))}
            {data.employees.filter((e) => e.status === 'leave').length === 0 && (
              <p className="fs-13 text-3 center" style={{ padding: 30 }}>Hozircha ta’tildagi xodim yo‘q.</p>
            )}
            <div className="card mt-2" style={{ background: 'var(--surface)', boxShadow: 'none' }}>
              <p className="card-title mb-2">Ta’til balansi (yillik)</p>
              {data.employees.slice(0, 6).map((e, i) => {
                const used = (i * 4) % 21
                return (
                  <div key={e.id} className="mb-2">
                    <div className="row-between fs-12" style={{ marginBottom: 4 }}>
                      <span className="text-2">{e.name}</span>
                      <span className="mono">{used} / 21 kun</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${(used / 21) * 100}%` }} /></div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* employee form */}
      <Modal
        open={formOpen} onClose={() => setFormOpen(false)}
        title={editing ? 'Xodimni tahrirlash' : 'Yangi xodim'}
        footer={
          <>
            <Button onClick={() => setFormOpen(false)}>Bekor qilish</Button>
            <Button variant="primary" loading={saving} onClick={submit as any}>{editing ? 'Saqlash' : 'Qo‘shish'}</Button>
          </>
        }
      >
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Field label="Ism va familiya" required error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aziza Karimova" invalid={!!errors.name} />
          </Field>
          <div className="grid-2">
            <Field label="Lavozim" required error={errors.position}>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Sotuv menejeri" invalid={!!errors.position} />
            </Field>
            <Field label="Bo‘lim" required>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Telefon" required error={errors.phone}>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123-45-67" invalid={!!errors.phone} />
            </Field>
            <Field label="Oylik ish haqi (so‘m)" required error={errors.salary}>
              <Input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="8000000" invalid={!!errors.salary} />
            </Field>
          </div>
          <Field label="Holat">
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="active">Faol</option>
              <option value="leave">Ta’tilda</option>
              <option value="inactive">Nofaol</option>
            </Select>
          </Field>
        </form>
      </Modal>

      {/* payroll confirm */}
      <Modal
        open={payrollOpen} onClose={() => setPayrollOpen(false)}
        title="Oylik ish haqini to‘lash"
        footer={
          <>
            <Button onClick={() => setPayrollOpen(false)}>Bekor qilish</Button>
            <Button variant="primary" loading={paying} onClick={() => {
              setPaying(true)
              setTimeout(() => {
                dispatch({ type: 'PAY_SALARIES' })
                toast('success', 'Ish haqi to‘landi.', 'Buxgalteriyada xarajat sifatida qayd etildi')
                setPaying(false); setPayrollOpen(false)
              }, 900)
            }}>To‘lash</Button>
          </>
        }
      >
        <p className="fs-13 text-2" style={{ lineHeight: 1.7 }}>
          {data.employees.filter((e) => e.status !== 'inactive').length} ta faol xodimga jami
          <b className="t-accent"> {formatUZS(totalSalary)}</b> to‘lanadi. Summa buxgalteriyada «Ish haqi»
          xarajati sifatida avtomatik qayd etiladi va cash flow kamayadi.
        </p>
      </Modal>

      {/* detail */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} subtitle={detail ? `${detail.position} • ${detail.department}` : ''}
        footer={detail && perm.can('hr', 'edit') ? <Button variant="primary" onClick={() => { openEdit(detail); setDetail(null) }}><Pencil />Tahrirlash</Button> : undefined}>
        {detail && (
          <>
            <div className="row mb-2" style={{ gap: 13 }}>
              <Avatar name={detail.name} size={54} />
              <div>
                <p className="fw-6 fs-14">{detail.name}</p>
                <p className="fs-12 text-3">{detail.position}</p>
                <div className="mt-1"><Badge variant={STATUS_VARIANT[detail.status]}>{STATUS_LABEL[detail.status]}</Badge></div>
              </div>
            </div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Bo‘lim</span><span className="fs-13 fw-6">{detail.department}</span></div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Telefon</span><span className="fs-13 mono">{detail.phone}</span></div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Oylik ish haqi</span><span className="mono fw-6">{formatUZS(detail.salary)}</span></div>
            <div className="stat-mini mb-2"><span className="text-2 fs-13">Ishga kirgan</span><span className="fs-13 mono">{formatDate(detail.hiredAt)}</span></div>
            <div className="mt-2">
              <div className="row-between fs-12" style={{ marginBottom: 5 }}>
                <span className="text-2">Samaradorlik</span><span className="mono fw-6">{detail.performance}%</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${detail.performance}%` }} /></div>
            </div>
          </>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Xodimni o‘chirish"
        message={`${deleting?.name} xodimlar ro‘yxatidan o‘chiriladi. Davom etasizmi?`}
        onConfirm={() => {
          if (!deleting) return
          dispatch({ type: 'DELETE_EMPLOYEE', id: deleting.id })
          toast('delete', `Xodim o‘chirildi: ${deleting.name}`)
          setDeleting(null)
        }}
      />
    </div>
  )
}
