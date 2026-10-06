import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bot, ChevronRight, Menu, Sparkles, X } from 'lucide-react'
import { DashboardPreview } from './DashboardPreview'
import {
  AICFOSection, FAQSection, FlowSection, ModulesSection, PricingSection,
  Reveal, RolesSection, SecuritySection, TrustSection,
} from './sections'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/ui/primitives'

const NAV_LINKS = [
  { href: '#platform', label: 'Platforma' },
  { href: '#ai-cfo', label: 'AI CFO' },
  { href: '#modules', label: 'Imkoniyatlar' },
  { href: '#production', label: 'Ishlab chiqarish' },
  { href: '#pricing', label: 'Narxlar' },
  { href: '#faq', label: 'FAQ' },
]

function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <nav className="pill-nav" style={{
        top: scrolled ? 10 : 18,
        transition: 'top .3s, box-shadow .3s',
        boxShadow: scrolled ? 'var(--shadow), var(--glow-sm)' : 'var(--shadow)',
      }} aria-label="Asosiy navigatsiya">
        <Link to="/" className="row" style={{ gap: 8, padding: '0 8px 0 12px' }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8, background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: 13,
            boxShadow: 'var(--glow-sm)',
          }}>B</span>
          <span className="font-display fw-7" style={{ fontSize: 14 }}>BALANS AI</span>
        </Link>
        {NAV_LINKS.map((l) => (
          <button key={l.href} className="pill-link" onClick={() => go(l.href)}>{l.label}</button>
        ))}
        <span style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px' }} className="hidden-mobile" />
        {user ? (
          <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ padding: '7px 14px' }}>Dashboard</Link>
        ) : (
          <>
            <Link to="/login" className="pill-link" style={{ color: 'var(--text)' }}>Kirish</Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ padding: '7px 15px' }}>30 kun bepul</Link>
          </>
        )}
        <button className="pill-link" style={{ display: 'none' }} id="nav-burger" onClick={() => setOpen((v) => !v)} aria-label="Menyu">
          {open ? <X style={{ width: 17, height: 17 }} /> : <Menu style={{ width: 17, height: 17 }} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="glass glass-2" style={{
          position: 'fixed', top: 68, left: 14, right: 14, zIndex: 99, padding: 10, borderRadius: 20,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {NAV_LINKS.map((l) => (
            <button key={l.href} className="sidebar-item" onClick={() => go(l.href)}>{l.label}</button>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
          <Link to="/login" className="sidebar-item" onClick={() => setOpen(false)}>Kirish</Link>
          <Link to="/register" className="btn btn-primary mt-1" onClick={() => setOpen(false)}>30 kun bepul</Link>
        </div>
      )}
      <style>{`
        @media (max-width: 880px) {
          .pill-nav .pill-link { display: none; }
          #nav-burger { display: block !important; }
        }
      `}</style>
    </>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { user, demoLogin } = useAuth()

  const scrollToPreview = () => {
    document.querySelector('#preview')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="landing" style={{ paddingTop: 84 }}>
      <LandingNavbar />

      {/* ---------- HERO ---------- */}
      <header className="hero-bg" style={{ position: 'absolute', inset: '0 0 auto 0', height: 940 }} aria-hidden>
        <div className="beam" />
        <div className="beam" style={{ left: '26%', top: '-40%', width: 700, height: '80%', animationDelay: '-6s', opacity: .6 }} />
        <div className="grid-lines" />
      </header>

      <section className="section" style={{ paddingTop: 48, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <span className="section-tag" style={{ marginBottom: 4 }}>
            <Sparkles style={{ width: 12, height: 12 }} />O‘zbekistondagi 1-raqamli AI biznes platformasi
          </span>
        </Reveal>
        <Reveal delay={80}>
          <h1 style={{
            fontSize: 'clamp(38px, 7vw, 78px)', fontWeight: 700, lineHeight: 1.06,
            letterSpacing: '-0.035em', marginTop: 26, maxWidth: 950, marginInline: 'auto',
          }}>
            Biznesingizni raqamlar emas,<br />
            <span className="grad-text">AI boshqarsin.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p style={{
            color: 'var(--text-2)', fontSize: 'clamp(15px, 1.6vw, 18px)', maxWidth: 640,
            margin: '22px auto 0', lineHeight: 1.7,
          }}>
            BALANS AI — buxgalteriya, moliya, savdo, ombor, ishlab chiqarish va HR jarayonlarini
            yagona aqlli platformaga birlashtiradi.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="row wrap" style={{ justifyContent: 'center', gap: 12, marginTop: 34 }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(user ? '/dashboard' : '/register')}>
              30 kun bepul sinab ko‘ring <ArrowRight style={{ width: 17, height: 17 }} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={scrollToPreview}>
              Platformani ko‘rish
            </button>
          </div>
          <p className="fs-12 text-3" style={{ marginTop: 14 }}>Karta talab qilinmaydi • 2 daqiqada tayyor • Demo bilan tanishing</p>
        </Reveal>

        {/* Product preview */}
        <Reveal delay={320} className="hero-preview-wrap">
          <div id="preview" style={{
            marginTop: 64, perspective: 1400, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: '6% -4% -8%', borderRadius: 40,
              background: 'radial-gradient(ellipse 60% 55% at 50% 40%, rgba(139,92,246,.24), transparent 70%)',
              filter: 'blur(30px)', pointerEvents: 'none',
            }} aria-hidden />
            <div style={{ transform: 'rotateX(4deg)', transformStyle: 'preserve-3d' }}>
              <DashboardPreview />
            </div>
          </div>
        </Reveal>
      </section>

      <TrustSection />
      <FlowSection />
      <AICFOSection />
      <ModulesSection />
      <RolesSection />
      <SecuritySection />
      <PricingSection onChoose={() => navigate(user ? '/billing' : '/register')} />
      <FAQSection />

      {/* ---------- FINAL CTA ---------- */}
      <section className="section" style={{ paddingBottom: 60 }}>
        <Reveal>
          <div className="card" style={{
            padding: 'clamp(36px, 6vw, 72px) 28px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            border: '1px solid rgba(139,92,246,.35)', boxShadow: 'var(--glow)',
          }}>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse 60% 80% at 50% 120%, rgba(232,121,249,.16), transparent 65%)',
            }} aria-hidden />
            <span className="section-tag"><Bot style={{ width: 12, height: 12 }} />BALANS AI</span>
            <h2 style={{ fontSize: 'clamp(26px, 4.4vw, 46px)', marginTop: 18, lineHeight: 1.12, letterSpacing: '-0.03em' }}>
              Biznesingizning aqlli<br /><span className="grad-text">moliyaviy markazi.</span>
            </h2>
            <p className="text-2" style={{ maxWidth: 520, margin: '16px auto 0', fontSize: 15.5, lineHeight: 1.7 }}>
              Raqamlarni ko‘ring. Muammoni toping. AI bilan qaror qiling. Bir klikda harakat qiling.
            </p>
            <div className="row wrap" style={{ justifyContent: 'center', gap: 12, marginTop: 30 }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate(user ? '/dashboard' : '/register')}>
                {user ? 'Dashboardga o‘tish' : '30 kun bepul boshlash'} <ArrowRight style={{ width: 17, height: 17 }} />
              </button>
              <button
                className="btn btn-ghost btn-lg"
                onClick={() => { if (!user) demoLogin('OWNER'); navigate('/dashboard') }}
              >
                <Sparkles style={{ width: 16, height: 16 }} /> Demo rejimda kirish
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '44px 24px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 28 }} className="footer-grid">
            <div>
              <div className="row" style={{ gap: 9 }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 9, background: 'var(--grad)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: 15,
                }}>B</span>
                <span className="font-display fw-7" style={{ fontSize: 16 }}>BALANS AI</span>
              </div>
              <p className="fs-13 text-2" style={{ marginTop: 12, lineHeight: 1.7, maxWidth: 300 }}>
                O‘zbekiston bizneslari uchun AI-powered buxgalteriya, moliya va biznes boshqaruv platformasi.
                Biznesingizning aqlli moliyaviy markazi.
              </p>
            </div>
            {[
              { title: 'Mahsulot', links: [['Platforma', '#platform'], ['AI CFO', '#ai-cfo'], ['Imkoniyatlar', '#modules'], ['Narxlar', '#pricing']] },
              { title: 'Kompaniya', links: [['Security', '#security'], ['FAQ', '#faq'], ['Contact', 'mailto:salom@balans.ai'], ['Blog', '#platform']] },
              { title: 'Qonuniy', links: [['Privacy', '#'], ['Terms', '#'], ['Cookie', '#'], ['Oferta', '#']] },
            ].map((col) => (
              <div key={col.title}>
                <p className="fw-6 fs-13" style={{ marginBottom: 12 }}>{col.title}</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="fs-13 text-2 row" style={{ gap: 4, transition: 'color .2s' }}
                        onClick={(e) => { if (href.startsWith('#') && href !== '#') { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }) } }}>
                        {label} <ChevronRight style={{ width: 11, height: 11, opacity: .5 }} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '32px 0 22px' }} />
          <div className="row-between wrap" style={{ gap: 10 }}>
            <p className="fs-12 text-3">© 2026 BALANS AI. Barcha huquqlar himoyalangan.</p>
            <p className="fs-12 text-3">Toshkent, O‘zbekiston • salom@balans.ai</p>
          </div>
        </div>
        <style>{`@media (max-width: 820px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
      </footer>
    </div>
  )
}
