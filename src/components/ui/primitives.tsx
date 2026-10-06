import React from 'react'

// Button with variants
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
export function Button({ variant = 'ghost', size = 'md', loading, children, className = '', disabled, ...rest }: BtnProps) {
  return (
    <button
      className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
      {children}
    </button>
  )
}

export function GlassCard({ children, className = '', hover, ...rest }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function Badge({ variant = 'neutral', children, className = '', style }: { variant?: 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral' | 'pink'; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <span className={`badge badge-${variant} ${className}`} style={style}>{children}</span>
}

export function Field({ label, required, error, children, className = '' }: {
  label?: string; required?: boolean; error?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`field ${className}`}>
      {label && <label>{label}{required && <span className="req"> *</span>}</label>}
      {children}
      {error && <span className="field-error"><span>⚠</span>{error}</span>}
    </div>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, className = '', ...rest } = props
  return <input className={`input ${invalid ? 'input-error' : ''} ${className}`} {...rest} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  const { invalid, className = '', children, ...rest } = props
  return <select className={`select ${invalid ? 'input-error' : ''} ${className}`} {...rest}>{children}</select>
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  const { invalid, className = '', ...rest } = props
  return <textarea className={`textarea ${invalid ? 'input-error' : ''} ${className}`} {...rest} />
}

export function EmptyState({ icon, title, text, action }: {
  icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode
}) {
  return (
    <div className="empty">
      <div className="e-icon">{icon}</div>
      <h4>{title}</h4>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function Spinner({ size = 17 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} />
}

export function Divider() { return <hr className="divider" /> }

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const ini = name.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('')
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {ini}
    </div>
  )
}

// Animated number count-up
export function CountUp({ value, format, duration = 900 }: { value: number; format: (v: number) => string; duration?: number }) {
  const [display, setDisplay] = React.useState(0)
  const [started, setStarted] = React.useState(false)
  const ref = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setStarted(true)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  React.useEffect(() => {
    if (!started) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, value, duration])

  return <span ref={ref} className="mono">{format(display)}</span>
}
