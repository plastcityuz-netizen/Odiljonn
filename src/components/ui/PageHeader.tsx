import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './primitives'

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function AccessDenied({ module, role }: { module: string; role: string }) {
  const navigate = useNavigate()
  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center', padding: 48 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, background: 'var(--danger-soft)', color: 'var(--danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 style={{ fontSize: 21 }}>Ruxsat cheklangan</h2>
        <p className="text-2 fs-13" style={{ marginTop: 8, lineHeight: 1.65 }}>
          «{module}» bo‘limi sizning rolingiz (<b>{role}</b>) uchun ochiq emas.
          Ruxsat olish uchun administrator yoki kompaniya egasi bilan bog‘laning.
        </p>
        <Button className="mt-3" onClick={() => navigate('/dashboard')}>Dashboardga qaytish</Button>
      </div>
    </div>
  )
}
