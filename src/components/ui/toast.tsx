import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info, Trash2 } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info' | 'delete'
interface ToastItem { id: number; kind: ToastKind; title: string; msg?: string }

const ToastContext = createContext<{
  toast: (kind: ToastKind, title: string, msg?: string) => void
} | null>(null)

const CONFIG: Record<ToastKind, { icon: React.ReactNode; bg: string; color: string }> = {
  success: { icon: <CheckCircle2 />, bg: 'var(--success-soft)', color: 'var(--success)' },
  error: { icon: <XCircle />, bg: 'var(--danger-soft)', color: 'var(--danger)' },
  info: { icon: <Info />, bg: 'var(--info-soft)', color: 'var(--info)' },
  delete: { icon: <Trash2 />, bg: 'var(--danger-soft)', color: 'var(--danger)' },
}

const TITLES: Record<ToastKind, string> = {
  success: 'Ma’lumot muvaffaqiyatli saqlandi.',
  error: 'Amalni bajarishda xatolik yuz berdi.',
  info: 'Ma’lumot.',
  delete: 'Ma’lumot o‘chirildi.',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const toast = useCallback((kind: ToastKind, title?: string, msg?: string) => {
    const id = ++counter.current
    setItems((prev) => [...prev.slice(-3), { id, kind, title: title ?? TITLES[kind], msg }])
    setTimeout(() => {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, hide: true } : t)) as ToastItem[])
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 300)
    }, 3600)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((t) => {
          const c = CONFIG[t.kind]
          return (
            <div key={t.id} className={`toast ${(t as any).hide ? 'hide' : ''}`}>
              <div className="t-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div className="t-title">{t.title}</div>
                {t.msg && <div className="t-msg">{t.msg}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
