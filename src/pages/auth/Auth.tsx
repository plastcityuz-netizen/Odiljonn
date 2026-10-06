import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bot, Building2, Check, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { Button, Field, Input, Select } from '../../components/ui/primitives'
import { ROLE_LABELS } from '../../lib/permissions'
import type { Role } from '../../lib/types'

// ---------- Shared auth shell ----------
function AuthShell({ title, sub, children, footer, wide }: {
  title: string; sub: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean
}) {
  return (
    <div className="landing" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 18px', position: 'relative', overflow: 'hidden' }}>
      <div className="hero-bg" style={{ position: 'fixed', inset: 0 }} aria-hidden>
        <div className="beam" />
        <div className="grid-lines" />
      </div>
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: wide ? 680 : 430 }}>
        <Link to="/" className="row" style={{ gap: 10, justifyContent: 'center', marginBottom: 26 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 12, background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: 19,
            boxShadow: 'var(--glow)',
          }}>B</span>
          <span className="font-display fw-7" style={{ fontSize: 20 }}>BALANS AI</span>
        </Link>
        <div className="glass glass-2" style={{ padding: '32px 30px', borderRadius: 24, boxShadow: 'var(--shadow), var(--glow-sm)' }}>
          <h1 style={{ fontSize: 23, textAlign: 'center' }}>{title}</h1>
          <p className="text-2 fs-13" style={{ textAlign: 'center', marginTop: 6, marginBottom: 22, lineHeight: 1.6 }}>{sub}</p>
          {children}
        </div>
        {footer && <div style={{ textAlign: 'center', marginTop: 18 }}>{footer}</div>}
      </div>
    </div>
  )
}

// ---------- Login ----------
export function LoginPage() {
  const { login, demoLogin, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('OWNER')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }) }, [user, navigate])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Email kiriting.')
    setLoading(true)
    setTimeout(() => {
      const res = login(email, password, role)
      setLoading(false)
      if (!res.ok) setError(res.error ?? 'Xatolik')
      else navigate('/dashboard')
    }, 600)
  }

  return (
    <AuthShell
      title="Platformaga kirish"
      sub="Biznesingizning aqlli moliyaviy markaziga xush kelibsiz."
      footer={<p className="fs-13 text-2">Akkauntingiz yo‘qmi? <Link to="/register" className="link-accent">Ro‘yxatdan o‘tish</Link></p>}
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email" required>
          <div className="searchbar" style={{ padding: 0, border: 'none', background: 'none' }}>
            <Mail style={{ width: 15, height: 15 }} />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@kompaniya.uz" style={{ paddingLeft: 4 }} invalid={!!error && !email} />
          </div>
        </Field>
        <Field label="Parol" required error={error}>
          <div className="searchbar" style={{ padding: 0, border: 'none', background: 'none' }}>
            <Lock style={{ width: 15, height: 15 }} />
            <Input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingLeft: 4 }} />
            <button type="button" onClick={() => setShowPw((v) => !v)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }} aria-label="Parolni ko‘rish">
              {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
            </button>
          </div>
        </Field>
        <div className="row-between">
          <Field label="Kirish roli (demo)">
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]} ({r})</option>
              ))}
            </Select>
          </Field>
          <Link to="/forgot-password" className="fs-12 link-accent" style={{ marginTop: 18 }}>Parolni unutdingizmi?</Link>
        </div>
        <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%', marginTop: 4 }}>
          Kirish <ArrowRight style={{ width: 16, height: 16 }} />
        </Button>
      </form>

      <div style={{ margin: '20px 0 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span className="fs-11 text-3">yoki demo sifatida kirish</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      <div className="chip-row" style={{ justifyContent: 'center' }}>
        {(['OWNER', 'ACCOUNTANT', 'SALES', 'WAREHOUSE', 'HR'] as Role[]).map((r) => (
          <button key={r} className="chip" onClick={() => { demoLogin(r); navigate('/dashboard') }}>{ROLE_LABELS[r]}</button>
        ))}
      </div>
      <p className="fs-11 text-3 center" style={{ marginTop: 12 }}>
        Demo: <b>odiljon@osiyosavdo.uz</b> / <b>balans2026</b>
      </p>
    </AuthShell>
  )
}

// ---------- Register ----------
export function RegisterPage() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate(user.id === 'usr_me' && !user.position ? '/onboarding' : '/dashboard', { replace: true })
  }, [user, navigate])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Parollar mos kelmadi.')
    setLoading(true)
    setTimeout(() => {
      const res = register(name, email, password)
      setLoading(false)
      if (!res.ok) setError(res.error ?? 'Xatolik')
      else navigate('/onboarding')
    }, 700)
  }

  return (
    <AuthShell
      title="30 kun bepul boshlang"
      sub="Karta talab qilinmaydi. 2 daqiqada biznesingizni BALANS AI’ga ulang."
      footer={<p className="fs-13 text-2">Akkauntingiz bormi? <Link to="/login" className="link-accent">Kirish</Link></p>}
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Ism va familiya" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Odiljon Nazarov" />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@kompaniya.uz" />
        </Field>
        <div className="grid-2" style={{ gap: 12 }}>
          <Field label="Parol" required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kamida 6 belgi" />
          </Field>
          <Field label="Parolni tasdiqlash" required error={error}>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" invalid={!!error} />
          </Field>
        </div>
        <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%', marginTop: 4 }}>
          Bepul boshlash <ArrowRight style={{ width: 16, height: 16 }} />
        </Button>
      </form>
      <div className="row" style={{ gap: 7, marginTop: 16, justifyContent: 'center' }}>
        {['Karta talab qilinmaydi', '30 kun to‘liq access', 'Istalgan vaqtda bekor qilish'].map((t) => (
          <span key={t} className="row fs-11 text-3" style={{ gap: 4 }}><Check style={{ width: 11, height: 11, color: 'var(--success)' }} />{t}</span>
        ))}
      </div>
    </AuthShell>
  )
}

// ---------- Forgot password ----------
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("To'g'ri email kiriting.")
    setError('')
    setLoading(true)
    setTimeout(() => { setLoading(false); setSent(true) }, 800)
  }

  return (
    <AuthShell
      title="Parolni tiklash"
      sub="Emailingizni kiriting — tiklash havolasini yuboramiz."
      footer={<Link to="/login" className="fs-13 text-2 row" style={{ gap: 5 }}><ArrowLeft style={{ width: 13, height: 13 }} />Kirish sahifasiga qaytish</Link>}
    >
      {sent ? (
        <div className="center" style={{ padding: '10px 0' }}>
          <div style={{ width: 54, height: 54, borderRadius: 17, background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Mail style={{ width: 24, height: 24 }} />
          </div>
          <p className="fw-6 fs-14">Havola yuborildi</p>
          <p className="fs-13 text-2" style={{ marginTop: 6, lineHeight: 1.65 }}>
            <b className="t-accent">{email}</b> manziliga parolni tiklash havolasi yuborildi.
            Spam papkasini ham tekshirib ko‘ring.
          </p>
          <Link to="/reset-password" className="btn btn-ghost btn-sm mt-3" style={{ display: 'inline-flex' }}>
            Demo: tiklash sahifasiga o‘tish
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email" required error={error}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@kompaniya.uz" invalid={!!error} />
          </Field>
          <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%' }}>
            Tiklash havolasini yuborish
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

// ---------- Reset password ----------
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Parol kamida 6 belgidan iborat bo‘lishi kerak.')
    if (password !== confirm) return setError('Parollar mos kelmadi.')
    setLoading(true)
    setTimeout(() => navigate('/login'), 900)
  }

  return (
    <AuthShell
      title="Yangi parol o‘rnatish"
      sub="Yangi parolingizni kiriting va tasdiqlang."
      footer={<Link to="/login" className="fs-13 text-2 row" style={{ gap: 5 }}><ArrowLeft style={{ width: 13, height: 13 }} />Kirish sahifasiga qaytish</Link>}
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Yangi parol" required>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kamida 6 belgi" />
        </Field>
        <Field label="Parolni tasdiqlash" required error={error}>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" invalid={!!error} />
        </Field>
        <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%' }}>
          Parolni yangilash
        </Button>
      </form>
    </AuthShell>
  )
}
