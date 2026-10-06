import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Bot, ShoppingCart, Users, Package, Truck, Factory,
  Calculator, Wallet, Receipt, UserCog, BarChart3, LineChart, Settings, X,
} from 'lucide-react'
import { useData } from '../../lib/store'
import { useAuth } from '../../lib/auth'
import { canAccess, type ModuleKey } from '../../lib/permissions'
import type { Role } from '../../lib/types'

interface NavEntry { key: ModuleKey; label: string; icon: React.ReactNode }
const SECTIONS: { title: string; items: NavEntry[] }[] = [
  {
    title: 'Boshqaruv',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
      { key: 'ai', label: 'AI CFO', icon: <Bot /> },
    ],
  },
  {
    title: 'Operatsion',
    items: [
      { key: 'sales', label: 'Savdo', icon: <ShoppingCart /> },
      { key: 'customers', label: 'Mijozlar', icon: <Users /> },
      { key: 'warehouse', label: 'Ombor', icon: <Package /> },
      { key: 'purchases', label: 'Xaridlar', icon: <Truck /> },
      { key: 'production', label: 'Ishlab chiqarish', icon: <Factory /> },
    ],
  },
  {
    title: 'Moliya',
    items: [
      { key: 'accounting', label: 'Buxgalteriya', icon: <Calculator /> },
      { key: 'finance', label: 'Moliya', icon: <Wallet /> },
      { key: 'debts', label: 'Qarzdorlik', icon: <Receipt /> },
    ],
  },
  {
    title: 'Tashkilot',
    items: [
      { key: 'hr', label: 'HR', icon: <UserCog /> },
      { key: 'reports', label: 'Hisobotlar', icon: <BarChart3 /> },
      { key: 'analytics', label: 'Analitika', icon: <LineChart /> },
    ],
  },
  {
    title: 'Tizim',
    items: [
      { key: 'settings', label: 'Sozlamalar', icon: <Settings /> },
    ],
  },
]

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const { data } = useData()
  const { user } = useAuth()
  const location = useLocation()
  const role: Role = user?.role ?? 'OWNER'

  return (
    <>
      {mobileOpen && <div className="drawer-overlay" style={{ zIndex: 140 }} onClick={onCloseMobile} />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`} aria-label="Asosiy navigatsiya">
        <div className="row" style={{ padding: '4px 8px 16px', justifyContent: 'space-between' }}>
          <NavLink to="/dashboard" className="row" style={{ gap: 10 }} onClick={onCloseMobile}>
            <div style={{
              width: 34, height: 34, borderRadius: 11, background: 'var(--grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: 16, flexShrink: 0,
              boxShadow: 'var(--glow-sm)',
            }}>B</div>
            <span className="s-head-label">
              <span className="font-display fw-7" style={{ fontSize: 15, display: 'block', lineHeight: 1.1 }}>BALANS AI</span>
              <span className="fs-10 text-3" style={{ letterSpacing: '.06em' }}>{data.company.name}</span>
            </span>
          </NavLink>
          <button className="modal-x hidden-mobile" onClick={onToggleCollapse} aria-label="Menyuni yig‘ish">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg>
          </button>
          <button className="modal-x" style={{ display: mobileOpen ? 'flex' : 'none' }} onClick={onCloseMobile} aria-label="Yopish"><X /></button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: 14 }} onClick={(e) => {
          // close mobile drawer on navigation
          if ((e.target as HTMLElement).closest('a')) onCloseMobile()
        }}>
          {SECTIONS.map((section) => {
            const visible = section.items.filter((it) => canAccess(role, it.key))
            if (!visible.length) return null
            return (
              <div key={section.title}>
                <div className="s-section fs-10 fw-7" style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.12em', padding: '0 12px 7px' }}>
                  {section.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {visible.map((it) => (
                    <NavLink
                      key={it.key}
                      to={it.key === 'ai' ? '/ai-cfo' : `/${it.key}`}
                      className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                      title={it.label}
                    >
                      {it.icon}
                      <span className="s-label">{it.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {canAccess(role, 'billing') && (
          <NavLink
            to="/billing"
            className={`sidebar-item ${location.pathname === '/billing' ? 'active' : ''}`}
            style={{ marginBottom: 6, border: '1px solid rgba(139,92,246,.3)', background: 'linear-gradient(90deg, rgba(139,92,246,.14), rgba(232,121,249,.06))' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            <span className="s-label fw-6">{data.plan.name === 'TRIAL' ? 'Trial davom etmoqda' : `Tarif: ${data.plan.name}`}</span>
          </NavLink>
        )}
      </aside>
    </>
  )
}
