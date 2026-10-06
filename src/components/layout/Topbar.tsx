import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Bot, Building2, Check, ChevronDown, LogOut, Menu, Moon, Search, Settings,
  Sun, User as UserIcon, CreditCard, Sparkles, Package, Users, ShoppingCart, Truck,
  Wallet, Receipt, ArrowRight, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { useData } from '../../lib/store'
import { Avatar } from '../ui/primitives'
import { ROLE_LABELS } from '../../lib/permissions'
import { Drawer } from '../ui/modals'
import { formatUZS, timeAgo } from '../../lib/utils'
import type { Notif } from '../../lib/types'

// ---------------- Global Search ----------------
export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useData()
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 60) } }, [open])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 1) return []
    const out: { group: string; icon: React.ReactNode; items: { id: string; title: string; sub: string; to: string }[] }[] = []
    const prods = data.products.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)).slice(0, 4)
    if (prods.length) out.push({ group: 'Mahsulotlar', icon: <Package />, items: prods.map((p) => ({ id: p.id, title: p.name, sub: `${p.sku} • ${p.stock} ${p.unit}`, to: `/warehouse?q=${encodeURIComponent(p.name)}` })) })
    const custs = data.customers.filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.company.toLowerCase().includes(s)).slice(0, 4)
    if (custs.length) out.push({ group: 'Mijozlar', icon: <Users />, items: custs.map((c) => ({ id: c.id, title: c.name, sub: c.phone, to: `/customers?id=${c.id}` })) })
    const orders = data.orders.filter((o) => o.id.toLowerCase().includes(s)).slice(0, 4)
    if (orders.length) out.push({ group: 'Buyurtmalar', icon: <ShoppingCart />, items: orders.map((o) => ({ id: o.id, title: o.id, sub: formatUZS(o.amount), to: `/sales?id=${o.id}` })) })
    const emps = data.employees.filter((e) => e.name.toLowerCase().includes(s) || e.position.toLowerCase().includes(s)).slice(0, 4)
    if (emps.length) out.push({ group: 'Xodimlar', icon: <UserIcon />, items: emps.map((e) => ({ id: e.id, title: e.name, sub: e.position, to: `/hr?id=${e.id}` })) })
    const sups = data.suppliers.filter((x) => x.name.toLowerCase().includes(s)).slice(0, 3)
    if (sups.length) out.push({ group: 'Yetkazib beruvchilar', icon: <Truck />, items: sups.map((x) => ({ id: x.id, title: x.name, sub: x.category, to: `/purchases?id=${x.id}` })) })
    const trxs = data.transactions.filter((t) => t.description.toLowerCase().includes(s) || t.category.toLowerCase().includes(s)).slice(0, 4)
    if (trxs.length) out.push({ group: 'Tranzaksiyalar', icon: <Wallet />, items: trxs.map((t) => ({ id: t.id, title: t.description, sub: `${t.category} • ${formatUZS(t.amount)}`, to: `/accounting?id=${t.id}` })) })
    return out
  }, [q, data])

  if (!open) return null

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxHeight: 520 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 20px 12px' }}>
          <div className="searchbar" style={{ padding: '12px 15px' }}>
            <Search />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mahsulot, mijoz, buyurtma, xodim qidirish..." style={{ fontSize: 14.5 }} />
            <span className="kbd">ESC</span>
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: '0 12px 16px', flex: 1 }}>
          {!q && (
            <div style={{ padding: 20 }}>
              <p className="fs-12 text-3 fw-6" style={{ textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Tezkor o‘tish</p>
              {([['/dashboard', 'Dashboard', <Sparkles />], ['/ai-cfo', 'AI CFO', <Bot />], ['/sales', 'Savdo', <ShoppingCart />], ['/warehouse', 'Ombor', <Package />], ['/finance', 'Moliya', <Wallet />], ['/debts', 'Qarzdorlik', <Receipt />]] as [string, string, React.ReactNode][]).map(([to, label, icon]) => (
                <button key={to} className="sidebar-item" onClick={() => { navigate(to); onClose() }}>
                  {icon}<span>{label}</span>
                </button>
              ))}
            </div>
          )}
          {q && results.length === 0 && (
            <div className="empty" style={{ padding: 32 }}>
              <div className="e-icon"><Search /></div>
              <h4 style={{ fontSize: 14 }}>«{q}» bo‘yicha natija topilmadi</h4>
              <p>Boshqa so‘z bilan qidirib ko‘ring.</p>
            </div>
          )}
          {results.map((g) => (
            <div key={g.group} style={{ marginBottom: 12 }}>
              <p className="fs-11 text-3 fw-7" style={{ textTransform: 'uppercase', letterSpacing: '.1em', padding: '4px 10px' }}>{g.group}</p>
              {g.items.map((it) => (
                <button key={it.id} className="sidebar-item" style={{ border: '1px solid transparent' }} onClick={() => { navigate(it.to); onClose() }}>
                  <span style={{ width: 17, height: 17, color: 'var(--accent-2)', display: 'flex', flexShrink: 0 }}>{g.icon}</span>
                  <span className="flex-1" style={{ minWidth: 0 }}>
                    <span className="fw-6" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                    <span className="fs-11 text-3">{it.sub}</span>
                  </span>
                  <ArrowRight style={{ width: 13, height: 13, color: 'var(--text-3)' }} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------- Notifications ----------------
const NOTIF_ICON: Record<Notif['type'], { icon: React.ReactNode; bg: string; color: string; label: string }> = {
  ai: { icon: <Bot />, bg: 'var(--accent-soft)', color: 'var(--accent-2)', label: 'AI' },
  finance: { icon: <Wallet />, bg: 'var(--success-soft)', color: 'var(--success)', label: 'Moliya' },
  warehouse: { icon: <Package />, bg: 'var(--warning-soft)', color: 'var(--warning)', label: 'Ombor' },
  debt: { icon: <Receipt />, bg: 'var(--danger-soft)', color: 'var(--danger)', label: 'Qarz' },
  system: { icon: <AlertCircle />, bg: 'var(--info-soft)', color: 'var(--info)', label: 'Tizim' },
}

export function NotificationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, dispatch } = useData()
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()
  const list = data.notifications.filter((n) => filter === 'all' || n.type === filter)
  const unread = data.notifications.filter((n) => !n.read).length

  return (
    <Drawer open={open} onClose={onClose} title="Bildirishnomalar" subtitle={unread > 0 ? `${unread} ta o‘qilmagan` : 'Hammasi o‘qilgan'}
      footer={unread > 0 ? <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'NOTIF_READ_ALL' })}><Check />Barchasini o‘qilgan deb belgilash</button> : undefined}>
      <div className="chip-row mb-2">
        {([['all', 'Barchasi'], ['ai', 'AI'], ['finance', 'Moliya'], ['warehouse', 'Ombor'], ['debt', 'Qarz'], ['system', 'Tizim']] as [string, string][]).map(([k, l]) => (
          <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {list.length === 0 && <p className="text-3 fs-13 center" style={{ padding: 26 }}>Bu toifada bildirishnoma yo‘q.</p>}
        {list.map((n) => {
          const cfg = NOTIF_ICON[n.type]
          return (
            <button
              key={n.id}
              onClick={() => {
                dispatch({ type: 'NOTIF_READ', id: n.id })
                if (n.type === 'ai') navigate('/ai-cfo')
                if (n.type === 'warehouse') navigate('/warehouse')
                if (n.type === 'debt') navigate('/debts')
                if (n.type === 'finance') navigate('/finance')
                onClose()
              }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left', padding: '13px 14px', borderRadius: 14,
                background: n.read ? 'transparent' : 'var(--surface)',
                border: `1px solid ${n.read ? 'var(--border)' : 'rgba(139,92,246,.28)'}`,
                cursor: 'pointer', width: '100%',
              }}
            >
              <span style={{ width: 34, height: 34, borderRadius: 11, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{cfg.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span className={`fs-13 ${n.read ? '' : 'fw-6'}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                  {!n.read && <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', flexShrink: 0 }} />}
                </span>
                <span className="fs-12 text-2" style={{ display: 'block', marginTop: 2, lineHeight: 1.5 }}>{n.message}</span>
                <span className="fs-11 text-3" style={{ display: 'block', marginTop: 4 }}>{cfg.label} • {timeAgo(n.time)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </Drawer>
  )
}

// ---------------- Topbar ----------------
export function Topbar({ onOpenSidebar, onOpenSearch, onOpenNotifications, theme, onToggleTheme }: {
  onOpenSidebar: () => void
  onOpenSearch: () => void
  onOpenNotifications: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}) {
  const { data } = useData()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [companyOpen, setCompanyOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const unread = data.notifications.filter((n) => !n.read).length

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setCompanyOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={onOpenSidebar} aria-label="Menyu">
        <Menu />
      </button>

      {/* Company selector */}
      <div ref={boxRef} style={{ position: 'relative' }} className="hidden-mobile">
        <button className="btn btn-ghost btn-sm" onClick={() => setCompanyOpen((v) => !v)} style={{ padding: '7px 12px' }}>
          <Building2 style={{ width: 15, height: 15, color: 'var(--accent-2)' }} />
          <span className="fw-6" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.company.name}</span>
          <ChevronDown style={{ width: 13, height: 13 }} />
        </button>
        {companyOpen && (
          <div className="glass glass-2" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 268, padding: 8, zIndex: 150, borderRadius: 16 }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
              <p className="fs-11 text-3 fw-6" style={{ textTransform: 'uppercase', letterSpacing: '.1em' }}>Faol kompaniya</p>
            </div>
            <div className="sidebar-item active" style={{ cursor: 'default' }}>
              <Building2 style={{ width: 16, height: 16 }} />
              <span className="flex-1"><span className="fw-6 fs-13" style={{ display: 'block' }}>{data.company.name}</span><span className="fs-11 text-3">{data.company.type}</span></span>
              <Check style={{ width: 15, height: 15, color: 'var(--success)' }} />
            </div>
            <button className="sidebar-item" onClick={() => { setCompanyOpen(false); navigate('/settings?tab=company') }}>
              <Settings style={{ width: 16, height: 16 }} />
              <span className="fs-13">Kompaniya sozlamalari</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Search trigger */}
      <button className="btn btn-ghost btn-sm hidden-mobile" onClick={onOpenSearch} style={{ gap: 10, padding: '8px 14px', minWidth: 215, justifyContent: 'space-between' }}>
        <span className="row" style={{ gap: 8, color: 'var(--text-3)' }}>
          <Search style={{ width: 14, height: 14 }} />
          <span className="fs-13">Qidirish...</span>
        </span>
        <span className="kbd">Ctrl K</span>
      </button>
      <button className="btn btn-ghost btn-icon mobile-only" onClick={onOpenSearch} aria-label="Qidirish"><Search /></button>

      {/* AI CFO */}
      <button className="btn btn-primary btn-sm" onClick={() => navigate('/ai-cfo')} style={{ gap: 7 }}>
        <Bot style={{ width: 15, height: 15 }} />
        <span className="hidden-mobile">AI CFO</span>
      </button>

      {/* Theme */}
      <button className="btn btn-ghost btn-icon" onClick={onToggleTheme} aria-label="Mavzu">
        {theme === 'dark' ? <Sun /> : <Moon />}
      </button>

      {/* Notifications */}
      <button className="btn btn-ghost btn-icon" onClick={onOpenNotifications} aria-label="Bildirishnomalar" style={{ position: 'relative' }}>
        <Bell />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5, minWidth: 16, height: 16, borderRadius: 99, background: 'var(--grad)',
            color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            boxShadow: '0 0 8px rgba(139,92,246,.6)',
          }}>{unread}</span>
        )}
      </button>

      {/* Profile */}
      <div ref={profileRef} style={{ position: 'relative' }}>
        <button onClick={() => setProfileOpen((v) => !v)} style={{ background: 'none', border: 'none', padding: 2, borderRadius: 99 }} aria-label="Profil">
          <Avatar name={user?.name ?? 'Foydalanuvchi'} size={34} />
        </button>
        {profileOpen && (
          <div className="glass glass-2" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, minWidth: 250, padding: 8, zIndex: 150, borderRadius: 16 }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6, display: 'flex', gap: 11, alignItems: 'center' }}>
              <Avatar name={user?.name ?? 'Foydalanuvchi'} size={38} />
              <div style={{ minWidth: 0 }}>
                <p className="fw-6 fs-13" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                <p className="fs-11 text-3">{user?.email}</p>
                <p className="fs-11 t-accent fw-6" style={{ marginTop: 1 }}>{ROLE_LABELS[user?.role ?? 'OWNER']}</p>
              </div>
            </div>
            <button className="sidebar-item" onClick={() => { setProfileOpen(false); navigate('/profile') }}><UserIcon style={{ width: 16, height: 16 }} /><span className="fs-13">Profil</span></button>
            <button className="sidebar-item" onClick={() => { setProfileOpen(false); navigate('/settings') }}><Settings style={{ width: 16, height: 16 }} /><span className="fs-13">Sozlamalar</span></button>
            <button className="sidebar-item" onClick={() => { setProfileOpen(false); navigate('/billing') }}><CreditCard style={{ width: 16, height: 16 }} /><span className="fs-13">To‘lovlar va tarif</span></button>
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <button className="sidebar-item" style={{ color: 'var(--danger)' }} onClick={() => { logout(); navigate('/') }}>
              <LogOut style={{ width: 16, height: 16 }} /><span className="fs-13">Chiqish</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
