import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bot, Boxes, Building2, Check, Factory, Package,
  ShoppingCart, UserCog, Users, Wallet, Sparkles,
} from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { useData } from '../../lib/store'
import { Button } from '../../components/ui/primitives'

const BUSINESS_TYPES = ['Ulgurji savdo', 'Chakana savdo', 'Ishlab chiqarish', 'Xizmatlar', 'Qurilish', 'IT va texnologiya', 'Oziq-ovqat', 'Boshqa']
const SIZES = ['1–5', '6–20', '21–50', '51–200', '200+']
const ACTIVITIES = ['Ofis mahsulotlari', 'Oziq-ovqat mahsulotlari', 'Kiyim-kechak', 'Qurilish materiallari', 'Elektronika', 'Kimyo va kosmetika', 'Boshqa']

const MODULE_OPTIONS = [
  { key: 'sales', label: 'Savdo', icon: <ShoppingCart /> },
  { key: 'customers', label: 'Mijozlar', icon: <Users /> },
  { key: 'warehouse', label: 'Ombor', icon: <Package /> },
  { key: 'purchases', label: 'Xaridlar', icon: <Boxes /> },
  { key: 'production', label: 'Ishlab chiqarish', icon: <Factory /> },
  { key: 'accounting', label: 'Buxgalteriya', icon: <Wallet /> },
  { key: 'hr', label: 'HR', icon: <UserCog /> },
  { key: 'ai', label: 'AI CFO', icon: <Bot /> },
]

const STEPS = ['Kompaniya nomi', 'Biznes turi', 'Xodimlar soni', 'Asosiy faoliyat', 'Kerakli modullar']

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, completeOnboarding } = useAuth()
  const { dispatch } = useData()
  const [step, setStep] = useState(0)
  const [companyName, setCompanyName] = useState(user?.id === 'usr_me' ? '' : 'Osiyo Savdo MChJ')
  const [type, setType] = useState('')
  const [size, setSize] = useState('')
  const [activity, setActivity] = useState('')
  const [modules, setModules] = useState<string[]>(['sales', 'warehouse', 'accounting', 'ai'])
  const [error, setError] = useState('')
  const [finishing, setFinishing] = useState(false)

  const canNext = () => {
    if (step === 0) return companyName.trim().length >= 2
    if (step === 1) return !!type
    if (step === 2) return !!size
    if (step === 3) return !!activity
    if (step === 4) return modules.length > 0
    return true
  }

  const next = () => {
    if (!canNext()) {
      setError(step === 0 ? 'Kompaniya nomini kiriting.' : step === 4 ? 'Kamida bitta modul tanlang.' : 'Tanlovni bajaring.')
      return
    }
    setError('')
    if (step < 4) setStep(step + 1)
    else finish()
  }

  const finish = () => {
    setFinishing(true)
    dispatch({
      type: 'UPDATE_COMPANY',
      company: {
        name: companyName.trim() || 'Mening kompaniyam',
        type: type || 'Ulgurji savdo',
        employeesCount: size || '1–5',
        activity: activity || 'Boshqa',
        modules,
      },
    })
    setTimeout(() => {
      completeOnboarding()
      navigate('/dashboard')
    }, 1400)
  }

  if (finishing) {
    return (
      <div className="landing" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-bg" style={{ position: 'fixed', inset: 0 }} aria-hidden><div className="beam" /></div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 20 }}>
          <div style={{
            width: 74, height: 74, borderRadius: 24, background: 'var(--grad)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', boxShadow: 'var(--glow)',
            animation: 'pulseGlow 2s infinite',
          }}>
            <Check style={{ width: 34, height: 34, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 28 }}>BALANS AI kompaniyangiz uchun tayyor.</h1>
          <p className="text-2 fs-14" style={{ marginTop: 10, maxWidth: 420, marginInline: 'auto', lineHeight: 1.7 }}>
            <b className="t-accent">{companyName}</b> uchun {modules.length} ta modul sozlandi.
            Dashboardga o‘tkazilyapmiz...
          </p>
          <div className="typing-dots" style={{ justifyContent: 'center', marginTop: 18 }}><span /><span /><span /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="landing" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 18px', position: 'relative', overflow: 'hidden' }}>
      <div className="hero-bg" style={{ position: 'fixed', inset: 0 }} aria-hidden>
        <div className="beam" />
        <div className="grid-lines" />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560 }}>
        <div className="row" style={{ gap: 9, justifyContent: 'center', marginBottom: 20 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 10, background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: 16,
          }}>B</span>
          <span className="font-display fw-7" style={{ fontSize: 17 }}>BALANS AI</span>
        </div>

        <div className="glass glass-2" style={{ padding: '30px 30px 26px', borderRadius: 24 }}>
          {/* progress */}
          <div className="row" style={{ gap: 6, marginBottom: 22 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 99,
                background: i <= step ? 'var(--grad)' : 'var(--surface-2)',
                transition: 'background .4s',
              }} />
            ))}
          </div>

          <p className="fs-11 t-accent fw-7" style={{ textTransform: 'uppercase', letterSpacing: '.12em' }}>
            Qadam {step + 1} / 5
          </p>
          <h1 style={{ fontSize: 21, marginTop: 6 }}>{STEPS[step]}</h1>
          <p className="fs-13 text-2" style={{ marginTop: 5, marginBottom: 22 }}>
            {[
              'Kompaniyangiz nomini kiriting — platforma shu nom bilan sozlanadi.',
              'Biznesingiz qaysi sohada ishlaydi?',
              'Jami xodimlar sonini tanlang.',
              'Asosiy faoliyat yo‘nalishingiz?',
              'Qaysi modullar sizga kerak? Keyinchalik sozlash mumkin.',
            ][step]}
          </p>

          {step === 0 && (
            <div className="field">
              <div className="searchbar" style={{ padding: '12px 15px' }}>
                <Building2 style={{ width: 16, height: 16 }} />
                <input
                  value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Masalan: Osiyo Savdo MChJ" autoFocus style={{ fontSize: 14.5 }}
                  onKeyDown={(e) => e.key === 'Enter' && next()}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="chip-row">
              {BUSINESS_TYPES.map((t) => (
                <button key={t} className={`chip ${type === t ? 'active' : ''}`} style={{ padding: '9px 16px', fontSize: 13 }} onClick={() => setType(t)}>{t}</button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="chip-row">
              {SIZES.map((s) => (
                <button key={s} className={`chip ${size === s ? 'active' : ''}`} style={{ padding: '9px 18px', fontSize: 13 }} onClick={() => setSize(s)}>
                  {s} xodim
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="chip-row">
              {ACTIVITIES.map((a) => (
                <button key={a} className={`chip ${activity === a ? 'active' : ''}`} style={{ padding: '9px 16px', fontSize: 13 }} onClick={() => setActivity(a)}>{a}</button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {MODULE_OPTIONS.map((m) => {
                const on = modules.includes(m.key)
                return (
                  <button
                    key={m.key}
                    onClick={() => setModules((prev) => (on ? prev.filter((x) => x !== m.key) : [...prev, m.key]))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', borderRadius: 13,
                      background: on ? 'linear-gradient(120deg, rgba(139,92,246,.18), rgba(232,121,249,.08))' : 'var(--surface)',
                      border: `1px solid ${on ? 'rgba(139,92,246,.45)' : 'var(--border)'}`,
                      color: on ? 'var(--text)' : 'var(--text-2)', fontSize: 13.5, fontWeight: 600,
                      cursor: 'pointer', transition: 'all .2s', textAlign: 'left',
                    }}
                  >
                    <span style={{ color: on ? 'var(--accent-2)' : 'var(--text-3)', display: 'flex' }}>{m.icon}</span>
                    <span style={{ flex: 1 }}>{m.label}</span>
                    {on && <Check style={{ width: 15, height: 15, color: 'var(--accent-2)' }} />}
                  </button>
                )
              })}
            </div>
          )}

          {error && <p className="field-error mt-2"><span>⚠</span>{error}</p>}

          <div className="row-between mt-3" style={{ marginTop: 24 }}>
            <Button onClick={() => (step === 0 ? navigate('/login') : setStep(step - 1))}>
              <ArrowLeft style={{ width: 15, height: 15 }} /> {step === 0 ? 'Chiqish' : 'Orqaga'}
            </Button>
            <Button variant="primary" onClick={next} disabled={!canNext() && step !== 0}>
              {step === 4 ? <>Tayyor <Sparkles style={{ width: 15, height: 15 }} /></> : <>Davom etish <ArrowRight style={{ width: 15, height: 15 }} /></>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
