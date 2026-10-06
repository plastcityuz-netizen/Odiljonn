import React, { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Bot, ShoppingCart, Package, MoreHorizontal } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar, GlobalSearch, NotificationsDrawer } from './Topbar'
import { useAuth } from '../../lib/auth'

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return (localStorage.getItem('balans_theme') as 'dark' | 'light') || 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('balans_theme', theme) } catch { /* noop */ }
  }, [theme])
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return { theme, toggle }
}

const BOTTOM_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { to: '/ai-cfo', label: 'AI', icon: <Bot /> },
  { to: '/sales', label: 'Savdo', icon: <ShoppingCart /> },
  { to: '/warehouse', label: 'Ombor', icon: <Package /> },
]

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Ctrl+K global search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // close mobile drawer on route change + scroll to top
  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="app-main">
        <Topbar
          onOpenSidebar={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => setNotifOpen(true)}
          theme={theme}
          onToggleTheme={toggle}
        />
        <main className="app-content fade-in" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="bottom-nav" aria-label="Mobil navigatsiya">
        {BOTTOM_ITEMS.map((it) => (
          <NavLink key={it.to} to={it.to} className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
            {it.icon}
            <span>{it.label}</span>
          </NavLink>
        ))}
        <button className="bn-item" onClick={() => setMobileOpen(true)} aria-label="Barcha bo‘limlar">
          <MoreHorizontal />
          <span>Boshqa</span>
        </button>
      </nav>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}
