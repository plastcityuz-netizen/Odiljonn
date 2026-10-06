import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { DataProvider } from './lib/store'
import { ToastProvider } from './components/ui/toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppLayout } from './components/layout/AppLayout'
import { Guarded } from './components/layout/Guarded'
import { Spinner } from './components/ui/primitives'

import Landing from './pages/landing/Landing'
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './pages/auth/Auth'
import Onboarding from './pages/auth/Onboarding'
import Dashboard from './pages/app/Dashboard'
import AICFO from './pages/app/AICFO'
import NotFound from './pages/NotFound'

const Sales = lazy(() => import('./pages/app/Sales'))
const Customers = lazy(() => import('./pages/app/Customers'))
const Warehouse = lazy(() => import('./pages/app/Warehouse'))
const Purchases = lazy(() => import('./pages/app/Purchases'))
const Production = lazy(() => import('./pages/app/Production'))
const Accounting = lazy(() => import('./pages/app/Accounting'))
const Finance = lazy(() => import('./pages/app/Finance'))
const Debts = lazy(() => import('./pages/app/Debts'))
const HR = lazy(() => import('./pages/app/HR'))
const Reports = lazy(() => import('./pages/app/Reports'))
const Analytics = lazy(() => import('./pages/app/Analytics'))
const Settings = lazy(() => import('./pages/app/Settings'))
const Profile = lazy(() => import('./pages/app/Profile'))
const Billing = lazy(() => import('./pages/app/Billing'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 120 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--grad)', animation: 'pulseGlow 1.6s infinite' }} />
        <Spinner size={22} />
      </div>
    </div>
  )
}

// Requires only an authenticated user (onboarding may still be pending)
function RequireUser({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

// Requires authenticated + onboarded user
function Protected({ children }: { children: React.ReactNode }) {
  const { user, onboarded } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

// Public-only pages redirect fully-authed users to the app
function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, onboarded } = useAuth()
  if (user && onboarded) return <Navigate to="/dashboard" replace />
  if (user && !onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function lazyGuarded(module: Parameters<typeof Guarded>[0]['module'], Component: React.LazyExoticComponent<React.ComponentType>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Guarded module={module}><Component /></Guarded>
    </Suspense>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Onboarding — needs user, but not onboarded */}
      <Route path="/onboarding" element={<RequireUser><Onboarding /></RequireUser>} />

      {/* Standalone 404 — declared before the app shell so unknown paths
          render the public 404 page for both authed and unauthed users */}
      <Route path="*" element={<NotFound />} />

      {/* Protected app shell */}
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route path="/dashboard" element={<Guarded module="dashboard"><Dashboard /></Guarded>} />
        <Route path="/ai-cfo" element={<Guarded module="ai"><AICFO /></Guarded>} />
        <Route path="/sales" element={lazyGuarded('sales', Sales)} />
        <Route path="/customers" element={lazyGuarded('customers', Customers)} />
        <Route path="/warehouse" element={lazyGuarded('warehouse', Warehouse)} />
        <Route path="/purchases" element={lazyGuarded('purchases', Purchases)} />
        <Route path="/production" element={lazyGuarded('production', Production)} />
        <Route path="/accounting" element={lazyGuarded('accounting', Accounting)} />
        <Route path="/finance" element={lazyGuarded('finance', Finance)} />
        <Route path="/debts" element={lazyGuarded('debts', Debts)} />
        <Route path="/hr" element={lazyGuarded('hr', HR)} />
        <Route path="/reports" element={lazyGuarded('reports', Reports)} />
        <Route path="/analytics" element={lazyGuarded('analytics', Analytics)} />
        <Route path="/settings" element={lazyGuarded('settings', Settings)} />
        <Route path="/profile" element={lazyGuarded('profile', Profile)} />
        <Route path="/billing" element={lazyGuarded('billing', Billing)} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
