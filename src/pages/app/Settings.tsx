import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bell, Building2, Check, CreditCard, Globe, Lock, Moon, Palette, Plug, Save,
  Shield, Sun, UserCog, Users as UsersIcon,
} from 'lucide-react'
import { useData } from '../../lib/store'
import { useAuth } from '../../lib/auth'
import { usePerm } from '../../components/layout/Guarded'
import { PageHeader } from '../../components/ui/PageHeader'
import { Avatar, Badge, Button, Field, Input, Select, Textarea } from '../../components/ui/primitives'
import { ConfirmDialog, Modal } from '../../components/ui/modals'
import { useToast } from '../../components/ui/toast'
import { ROLE_LABELS } from '../../lib/permissions'
import type { Role } from '../../lib/types'

const TABS = [
  { key: 'company', label: 'Kompaniya', icon: <Building2 /> },
  { key: 'profile', label: 'Profil', icon: <UserCog /> },
  { key: 'users', label: 'Foydalanuvchilar', icon: <UsersIcon /> },
  { key: 'roles', label: 'Rollar', icon: <Shield /> },
  { key: 'permissions', label: 'Ruxsatlar', icon: <Lock /> },
  { key: 'notifications', label: 'Bildirishnomalar', icon: <Bell /> },
  { key: 'appearance', label: 'Ko‘rinish', icon: <Palette /> },
  { key: 'security', label: 'Xavfsizlik', icon: <Shield /> },
  { key: 'billing', label: 'To‘lovlar', icon: <CreditCard /> },
  { key: 'integrations', label: 'Integratsiyalar', icon: <Plug /> },
]

export default function Settings() {
  const { data, dispatch, resetDemo } = useData()
  const { user, updateUser, logout } = useAuth()
  const perm = usePerm()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') ?? 'company')
  const navigate = useNavigate()

  // company
  const [company, setCompany] = useState({ ...data.company })
  const [savingCompany, setSavingCompany] = useState(false)

  // profile
  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', position: user?.position ?? '' })

  // users
  const [userForm, setUserForm] = useState<null | { name: string; email: string; role: Role }>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)

  // security
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')

  // appearance
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  const [compact, setCompact] = useState(data.settings.compactMode)

  // notifications
  const [notifSettings, setNotifSettings] = useState({ ...data.settings })

  const switchTab = (k: string) => { setTab(k); setParams({ tab: k }) }

  const saveCompany = () => {
    setSavingCompany(true)
    setTimeout(() => {
      dispatch({ type: 'UPDATE_COMPANY', company })
      setSavingCompany(false)
      toast('success', 'Kompaniya ma’lumotlari saqlandi.')
    }, 600)
  }

  const saveProfile = () => {
    if (profile.name.trim().length < 2) return toast('error', 'Ismni kiriting.')
    updateUser({ name: profile.name.trim(), email: profile.email, phone: profile.phone, position: profile.position })
    dispatch({ type: 'ACTIVITY', action: 'Profil ma’lumotlarini yangiladi' })
    toast('success', 'Profil saqlandi.')
  }

  const toggleSetting = (key: keyof typeof notifSettings) => {
    const next = { ...notifSettings, [key]: !notifSettings[key] }
    setNotifSettings(next)
    dispatch({ type: 'UPDATE_SETTINGS', settings: next })
    toast('success', 'Sozlama saqlandi.')
  }

  const changeTheme = (t: 'dark' | 'light') => {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('balans_theme', t)
    toast('success', `Mavzu: ${t === 'dark' ? 'Tungi' : 'Kunduzgi'}`)
  }

  return (
    <div className="page">
      <PageHeader title="Sozlamalar" sub="Kompaniya, foydalanuvchilar, rollar, xavfsizlik va integratsiyalar boshqaruvi." />

      <div className="tabs mb-3">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => switchTab(t.key)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ---------- COMPANY ---------- */}
      {tab === 'company' && (
        <div className="card" style={{ maxWidth: 760 }}>
          <div className="row mb-3" style={{ gap: 13 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: '#fff' }}>
              {company.name[0] ?? 'B'}
            </div>
            <div>
              <p className="card-title" style={{ fontSize: 16 }}>{company.name}</p>
              <p className="card-sub">{company.type} • {company.employeesCount} xodim</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid-2">
              <Field label="Kompaniya nomi" required>
                <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
              </Field>
              <Field label="STIR (soliq ID)">
                <Input value={company.taxId} onChange={(e) => setCompany({ ...company, taxId: e.target.value })} />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Biznes turi">
                <Input value={company.type} onChange={(e) => setCompany({ ...company, type: e.target.value })} />
              </Field>
              <Field label="Xodimlar soni">
                <Select value={company.employeesCount} onChange={(e) => setCompany({ ...company, employeesCount: e.target.value })}>
                  {['1–5', '6–20', '21–50', '51–200', '200+'].map((s) => <option key={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Asosiy faoliyat">
              <Input value={company.activity} onChange={(e) => setCompany({ ...company, activity: e.target.value })} />
            </Field>
            <Field label="Manzil">
              <Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
            </Field>
            <Field label="Valyuta">
              <Select value={company.currency} onChange={(e) => setCompany({ ...company, currency: e.target.value })}>
                <option value="UZS">UZS — so‘m</option>
                <option value="USD">USD — dollar</option>
              </Select>
            </Field>
            <div className="row">
              <Button variant="primary" loading={savingCompany} onClick={saveCompany}><Save />Saqlash</Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- PROFILE ---------- */}
      {tab === 'profile' && (
        <div className="card" style={{ maxWidth: 620 }}>
          <div className="row mb-3" style={{ gap: 14 }}>
            <Avatar name={profile.name || 'Foydalanuvchi'} size={56} />
            <div>
              <p className="card-title" style={{ fontSize: 16 }}>{profile.name}</p>
              <p className="card-sub">{user?.email} • {ROLE_LABELS[user?.role ?? 'OWNER']}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid-2">
              <Field label="Ism va familiya" required>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Telefon">
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+998 ..." />
              </Field>
              <Field label="Lavozim">
                <Input value={profile.position} onChange={(e) => setProfile({ ...profile, position: e.target.value })} placeholder="Bosh direktor" />
              </Field>
            </div>
            <div className="row">
              <Button variant="primary" onClick={saveProfile}><Save />Saqlash</Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- USERS ---------- */}
      {tab === 'users' && (
        <div className="card">
          <div className="row-between wrap mb-3">
            <p className="card-title">Foydalanuvchilar — {data.users.length}</p>
            {perm.can('settings', 'create') && (
              <Button size="sm" variant="primary" onClick={() => setUserForm({ name: '', email: '', role: 'SALES' })}>Foydalanuvchi qo‘shish</Button>
            )}
          </div>
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Foydalanuvchi</th><th>Email</th><th>Rol</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td><div className="row" style={{ gap: 10 }}><Avatar name={u.name} size={30} /><div><p className="fw-6 fs-13">{u.name}</p><p className="fs-11 text-3">{u.position}</p></div></div></td>
                    <td className="fs-12 mono text-2">{u.email}</td>
                    <td><Badge variant="accent">{ROLE_LABELS[u.role]}</Badge></td>
                    <td><Badge variant={u.active ? 'success' : 'neutral'}>{u.active ? 'Faol' : 'Nofaol'}</Badge></td>
                    <td className="right">
                      {perm.can('settings', 'edit') && u.id !== user?.id && (
                        <div className="row-actions">
                          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'UPDATE_USER', user: { ...u, active: !u.active } })}>
                            {u.active ? 'O‘chirish' : 'Yoqish'}
                          </Button>
                          <Button size="sm" variant="ghost" className="t-danger" onClick={() => setDeletingUser(u.id)}>✕</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-cards">
              {data.users.map((u) => (
                <div key={u.id} className="table-card-item">
                  <div className="table-card-row"><span className="table-card-label">Foydalanuvchi</span><span className="fw-6 fs-13">{u.name}</span></div>
                  <div className="table-card-row"><span className="table-card-label">Rol</span><span>{ROLE_LABELS[u.role]}</span></div>
                  <div className="table-card-row"><span className="table-card-label">Holat</span><span>{u.active ? 'Faol' : 'Nofaol'}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- ROLES ---------- */}
      {tab === 'roles' && (
        <div className="grid-3">
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <div key={r} className="card card-hover">
              <div className="row-between">
                <div className="kpi-icon"><Shield /></div>
                <Badge variant="accent">{r}</Badge>
              </div>
              <h3 style={{ fontSize: 15, marginTop: 13 }}>{ROLE_LABELS[r]}</h3>
              <p className="fs-12 text-2" style={{ marginTop: 6, lineHeight: 1.6 }}>
                {r === 'OWNER' && 'Tizimga to‘liq kirish: barcha modullar, foydalanuvchilar, xavfsizlik va hisobotlar.'}
                {r === 'ADMIN' && 'Tizim boshqaruvi: foydalanuvchilar, rollar, integratsiyalar va sozlamalar.'}
                {r === 'ACCOUNTANT' && 'Buxgalteriya, moliya, qarzdorlik va moliyaviy hisobotlar.'}
                {r === 'MANAGER' && 'Barcha bo‘limlarni ko‘rish va savdo jarayonlarini boshqarish.'}
                {r === 'SALES' && 'Savdo va mijozlar moduli: buyurtmalar, to‘lovlar, mijozlar bazasi.'}
                {r === 'WAREHOUSE' && 'Ombor: mahsulotlar, qoldiqlar, inventarizatsiya va xaridlar.'}
                {r === 'HR' && 'Xodimlar, ish haqi, davomat va HR hisobotlari.'}
                {r === 'PRODUCTION' && 'Ishlab chiqarish: buyruqlar, xomashyo va tannarx hisobi.'}
              </p>
              <p className="fs-11 text-3 mt-2">{data.users.filter((u) => u.role === r).length} foydalanuvchi</p>
            </div>
          ))}
        </div>
      )}

      {/* ---------- PERMISSIONS ---------- */}
      {tab === 'permissions' && (
        <div className="card">
          <p className="card-title mb-1">Ruxsatlar matritsasi</p>
          <p className="card-sub mb-3">Rol va modul kesimida kirish huquqlari. V — to‘liq, K — faqat ko‘rish.</p>
          <div className="table-wrap has-cards">
            <table className="table">
              <thead>
                <tr>
                  <th>Modul</th>
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <th key={r} className="center">{r.slice(0, 5)}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Dashboard', 'dashboard'], ['AI CFO', 'ai'], ['Savdo', 'sales'], ['Mijozlar', 'customers'],
                  ['Ombor', 'warehouse'], ['Xaridlar', 'purchases'], ['Ishlab chiqarish', 'production'],
                  ['Buxgalteriya', 'accounting'], ['Moliya', 'finance'], ['Qarzdorlik', 'debts'],
                  ['HR', 'hr'], ['Hisobotlar', 'reports'], ['Analitika', 'analytics'], ['Sozlamalar', 'settings'],
                ].map(([label, key]) => (
                  <tr key={key}>
                    <td className="fw-6 fs-13">{label}</td>
                    {(Object.keys(ROLE_LABELS) as Role[]).map((r) => {
                      const mods: Record<string, string[]> = {
                        OWNER: ['dashboard', 'ai', 'sales', 'customers', 'warehouse', 'purchases', 'production', 'accounting', 'finance', 'debts', 'hr', 'reports', 'analytics', 'settings'],
                        ADMIN: ['dashboard', 'ai', 'sales', 'customers', 'warehouse', 'purchases', 'production', 'accounting', 'finance', 'debts', 'hr', 'reports', 'analytics', 'settings'],
                        ACCOUNTANT: ['dashboard', 'ai', 'sales', 'customers', 'purchases', 'accounting', 'finance', 'debts', 'reports', 'analytics', 'settings'],
                        MANAGER: ['dashboard', 'ai', 'sales', 'customers', 'warehouse', 'purchases', 'production', 'accounting', 'finance', 'debts', 'hr', 'reports', 'analytics', 'settings'],
                        SALES: ['dashboard', 'ai', 'sales', 'customers', 'warehouse', 'debts', 'reports'],
                        WAREHOUSE: ['dashboard', 'ai', 'warehouse', 'purchases', 'production', 'reports'],
                        HR: ['dashboard', 'ai', 'hr', 'reports'],
                        PRODUCTION: ['dashboard', 'ai', 'production', 'warehouse', 'purchases', 'reports'],
                      }
                      const ro = ['SALES', 'WAREHOUSE', 'HR', 'PRODUCTION'].includes(r)
                      const has = mods[r]?.includes(key)
                      return (
                        <td key={r} className="center">
                          {has ? <span className="t-success" title={ro ? 'Faqat ko‘rish' : 'To‘liq'}>{ro && r !== 'OWNER' ? 'K' : 'V'}</span> : <span className="text-3">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- NOTIFICATIONS ---------- */}
      {tab === 'notifications' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <p className="card-title mb-1">Bildirishnoma sozlamalari</p>
          <p className="card-sub mb-3">Qaysi hodisalar haqida xabar olmoqchisiz?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              ['lowStockAlerts', 'Ombor: qoldiq kamaydi', 'Mahsulot minimal qoldiqdan pastga tushganda'],
              ['debtReminders', 'Qarzdorlik: muddat o‘tdi', 'Debitor qarzining muddati o‘tganda'],
              ['dailyDigest', 'Kunlik AI CFO digest', 'Har kuni ertalab biznes holati bo‘yicha'],
              ['productionAlerts', 'Ishlab chiqarish ogohlantirishlari', 'Buyruq holati o‘zgarganda'],
              ['emailNotifs', 'Email orqali yuborish', 'Barcha bildirishnomalar emailga ham tushadi'],
              ['smsNotifs', 'SMS orqali yuborish', 'Muhim ogohlantirishlar SMS bilan'],
            ] as [keyof typeof notifSettings, string, string][]).map(([key, label, desc]) => (
              <div key={key} className="stat-mini" style={{ cursor: 'pointer' }} onClick={() => toggleSetting(key)}>
                <div>
                  <p className="fw-6 fs-13">{label}</p>
                  <p className="fs-11 text-3">{desc}</p>
                </div>
                <button
                  className="btn btn-sm"
                  style={{
                    background: notifSettings[key] ? 'var(--grad)' : 'var(--surface-2)',
                    color: notifSettings[key] ? '#fff' : 'var(--text-3)',
                    border: '1px solid ' + (notifSettings[key] ? 'transparent' : 'var(--border)'),
                    minWidth: 46, justifyContent: 'center',
                  }}
                  aria-pressed={notifSettings[key]}
                >
                  {notifSettings[key] ? 'Yoqilgan' : 'O‘chirilgan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- APPEARANCE ---------- */}
      {tab === 'appearance' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <p className="card-title mb-3">Ko‘rinish</p>
          <div className="grid-2" style={{ gap: 12 }}>
            {([['dark', 'Tungi rejim', <Moon key="m" />], ['light', 'Kunduzgi rejim', <Sun key="s" />]] as ['dark' | 'light', string, React.ReactNode][]).map(([t, label, icon]) => (
              <button
                key={t}
                onClick={() => changeTheme(t)}
                className="card card-hover"
                style={{
                  cursor: 'pointer', textAlign: 'left',
                  border: theme === t ? '1px solid rgba(139,92,246,.5)' : undefined,
                  boxShadow: theme === t ? 'var(--glow-sm)' : undefined,
                }}
              >
                <div className="row-between">
                  <span className="kpi-icon">{icon}</span>
                  {theme === t && <Check style={{ width: 16, height: 16, color: 'var(--accent-2)' }} />}
                </div>
                <p className="fw-6 fs-14 mt-2">{label}</p>
                <p className="fs-11 text-3">{t === 'dark' ? 'Premium tungi estetika — asosiy mavzu' : 'Yorug‘ professional rejim'}</p>
              </button>
            ))}
          </div>
          <div className="stat-mini mt-3" style={{ cursor: 'pointer' }} onClick={() => { setCompact(!compact); dispatch({ type: 'UPDATE_SETTINGS', settings: { compactMode: !compact } }); toast('success', compact ? 'Oddiy rejim' : 'Ixcham rejim') }}>
            <div>
              <p className="fw-6 fs-13">Ixcham rejim</p>
              <p className="fs-11 text-3">Jadval va kartalarni ixcham ko‘rsatish</p>
            </div>
            <Badge variant={compact ? 'success' : 'neutral'}>{compact ? 'Yoqilgan' : 'O‘chirilgan'}</Badge>
          </div>
        </div>
      )}

      {/* ---------- SECURITY ---------- */}
      {tab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
          <div className="card">
            <p className="card-title mb-3">Parolni o‘zgartirish</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <Field label="Hozirgi parol">
                <Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
              </Field>
              <div className="grid-2">
                <Field label="Yangi parol" error={pwError}>
                  <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
                </Field>
                <Field label="Parolni tasdiqlash">
                  <Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                </Field>
              </div>
              <div>
                <Button variant="primary" onClick={() => {
                  if (pw.next.length < 6) return setPwError('Parol kamida 6 belgi.')
                  if (pw.next !== pw.confirm) return setPwError('Parollar mos kelmadi.')
                  setPwError('')
                  setPw({ current: '', next: '', confirm: '' })
                  toast('success', 'Parol yangilandi.')
                }}><Lock />Parolni yangilash</Button>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="card-title mb-3">Xavfsizlik holati</p>
            {[
              ['Rol asosida kirish nazorati', true, '8 rol, modul va amal darajasida'],
              ['Faoliyat jurnali', true, `${data.activity.length} yozuv kuzatilmoqda`],
              ['Himoyalangan marshrutlar', true, 'Ruxsatsiz kirish bloklangan'],
              ['Ikki faktorli autentifikatsiya', false, 'Tez orada'],
            ].map(([label, on, desc]) => (
              <div key={label as string} className="stat-mini mb-1">
                <div><p className="fw-6 fs-13">{label as string}</p><p className="fs-11 text-3">{desc as string}</p></div>
                <Badge variant={on ? 'success' : 'neutral'}>{on ? 'Faol' : 'Rejada'}</Badge>
              </div>
            ))}
          </div>

          <div className="card" style={{ border: '1px solid rgba(248,113,113,.3)' }}>
            <p className="card-title mb-1 t-danger">Xavfli hudud</p>
            <p className="card-sub mb-3">Demo ma’lumotlarni boshlang‘ich holatga qaytarish.</p>
            <div className="row wrap">
              <Button variant="danger" onClick={() => { resetDemo(); toast('success', 'Demo ma’lumotlar qayta yuklandi.') }}>Demo datani tiklash</Button>
              <Button variant="ghost" className="t-danger" onClick={() => { logout(); window.location.href = '/' }}>Chiqish</Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- BILLING (link) ---------- */}
      {tab === 'billing' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <p className="card-title">To‘lovlar va tarif</p>
          <p className="card-sub mb-3">Joriy tarif: {data.plan.name} — keyingi to‘lov {new Date(data.plan.nextPayment).toLocaleDateString('uz')}</p>
          <Button variant="primary" onClick={() => navigate('/billing')}>
            <CreditCard />To‘lovlar bo‘limiga o‘tish
          </Button>
        </div>
      )}

      {/* ---------- INTEGRATIONS ---------- */}
      {tab === 'integrations' && (
        <div className="grid-3">
          {[
            ['Telegram bot', 'Bildirishnomalar va tezkor hisobotlar', true],
            ['Google Sheets', 'Ma’lumotlarni eksport va sinxronlash', true],
            ['1C Buxgalteriya', 'Buxgalteriya exchange orqali', false],
            ['Payme', 'Onlayn to‘lovlar qabul qilish', true],
            ['Click', 'Onlayn to‘lovlar qabul qilish', false],
            ['SMS eslatmalar', 'Qarz eslatmalari SMS orqali', true],
            ['E-faktura', 'Elektron hisob-fakturalar', false],
            ['Bank API', 'To‘lovlarni avtomatik yuklash', false],
            ['Webhook', 'Tizim hodisalarini tashqi tizimga', true],
          ].map(([name, desc, on]) => (
            <div key={name as string} className="card card-hover">
              <div className="row-between">
                <div className="kpi-icon"><Globe /></div>
                <Badge variant={on ? 'success' : 'neutral'}>{on ? 'Ulangan' : 'Rejada'}</Badge>
              </div>
              <h3 style={{ fontSize: 14.5, marginTop: 13 }}>{name as string}</h3>
              <p className="fs-12 text-2" style={{ marginTop: 5, lineHeight: 1.55 }}>{desc as string}</p>
              <Button size="sm" className="mt-2" onClick={() => toast(on ? 'info' : 'info', on ? `${name} sozlamalari` : `${name} tez orada`, on ? 'Ulanish sozlandi' : 'Integratsiya yo‘lda')}>
                {on ? 'Boshqarish' : 'Kutish ro‘yxati'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* user add modal */}
      <Modal
        open={!!userForm} onClose={() => setUserForm(null)}
        title="Yangi foydalanuvchi"
        footer={
          <>
            <Button onClick={() => setUserForm(null)}>Bekor qilish</Button>
            <Button variant="primary" onClick={() => {
              if (!userForm) return
              if (userForm.name.trim().length < 2 || !userForm.email.includes('@')) return toast('error', 'Ism va emailni to‘g‘ri kiriting.')
              dispatch({ type: 'ADD_USER', user: { ...userForm, active: true, position: ROLE_LABELS[userForm.role] } })
              toast('success', 'Foydalanuvchi qo‘shildi.', `${userForm.name} — ${ROLE_LABELS[userForm.role]}`)
              setUserForm(null)
            }}>Qo‘shish</Button>
          </>
        }
      >
        {userForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <Field label="Ism" required>
              <Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            </Field>
            <Field label="Rol" required>
              <Select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as Role })}>
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </Select>
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Foydalanuvchini o‘chirish"
        message="Bu foydalanuvchi tizimdan o‘chiriladi. Davom etasizmi?"
        onConfirm={() => {
          if (deletingUser) {
            dispatch({ type: 'DELETE_USER', id: deletingUser })
            toast('delete', 'Foydalanuvchi o‘chirildi.')
          }
          setDeletingUser(null)
        }}
      />
    </div>
  )
}
