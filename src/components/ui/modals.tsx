import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './primitives'

// Modal — ESC close + outside click
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <div className="card-sub" style={{ marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button className="modal-x" onClick={onClose} aria-label="Yopish"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

// Drawer — right side panel
export function Drawer({ open, onClose, title, subtitle, children, footer, width }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string
  children: React.ReactNode; footer?: React.ReactNode; width?: number
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <>
      <div className="drawer-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }} />
      <aside className="drawer" style={width ? { width } : undefined} role="dialog" aria-label={title}>
        <div className="row-between" style={{ padding: '20px 22px 14px' }}>
          <div>
            <h3 style={{ fontSize: 17 }}>{title}</h3>
            {subtitle && <div className="card-sub" style={{ marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button className="modal-x" onClick={onClose} aria-label="Yopish"><X /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 22px 20px' }}>{children}</div>
        {footer && <div style={{ padding: '14px 22px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
      </aside>
    </>
  )
}

// Confirm dialog
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'O‘chirish', loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void
  title: string; message: string; confirmLabel?: string; loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={
      <>
        <Button onClick={onClose}>Bekor qilish</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </>
    }>
      <p className="text-2 fs-13" style={{ lineHeight: 1.65 }}>{message}</p>
    </Modal>
  )
}
