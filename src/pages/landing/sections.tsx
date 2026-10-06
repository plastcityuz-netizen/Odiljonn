import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Bot, Boxes, Check, ChevronDown, Factory, FileBarChart, LineChart,
  Lock, Package, ScrollText, ShieldCheck, ShoppingCart, Sparkles, UserCog, Users, Wallet, Zap,
  Activity, Eye, FileCheck, Server, KeyRound, Database,
} from 'lucide-react'
import { CountUp } from '../../components/ui/primitives'
import { formatCompact } from '../../lib/utils'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../lib/permissions'
import type { Role } from '../../lib/types'

export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver((e) => { if (e[0].isIntersecting) { setInView(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${inView ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// ============ Trust / Core value ============
export function TrustSection() {
  const stats = [
    { value: 1200, suffix: '+', label: 'Biznes BALANS AI’dan foydalanadi' },
    { value: 4.2, suffix: ' mlrd', label: 'so‘m — oyiga boshqariladigan aylanma', decimals: 1 },
    { value: 38, suffix: '%', label: 'hisobot tayyorlash vaqti tejaldi' },
    { value: 12, suffix: '', label: 'modul yagona platformada' },
  ]
  return (
    <section className="section" style={{ paddingTop: 40 }}>
      <Reveal>
        <div className="card" style={{ padding: '34px 30px' }}>
          <div className="grid-4" style={{ gap: 20 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p className="font-display fw-7 grad-text" style={{ fontSize: 34, lineHeight: 1.1 }}>
                  <CountUp value={s.value} format={(v) => `${s.decimals ? v.toFixed(1) : Math.round(v)}${s.suffix}`} />
                </p>
                <p className="fs-12 text-2" style={{ marginTop: 6 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid-3 mt-3">
        {[
          { icon: <Zap />, title: 'Buxgalteriya avtomatik', text: 'Har bir savdo, xarid va ishlab chiqarish avtomatik hisobotga aylanadi. Qo‘lda jurnal yuritish tugadi.' },
          { icon: <Bot />, title: 'AI nafaqat ko‘rsatadi — tushuntiradi', text: 'BALANS AI muammoni topadi, sababini aniqlaydi va aniq harakatni tavsiya qiladi.' },
          { icon: <Boxes />, title: 'Butun biznes — bitta markazda', text: 'Savdo, ombor, ishlab chiqarish, moliya va HR real vaqtda bir-biri bilan sinxron ishlaydi.' },
        ].map((v, i) => (
          <Reveal key={i} delay={i * 90}>
            <div className="card card-hover" style={{ height: '100%' }}>
              <div className="kpi-icon">{v.icon}</div>
              <h3 style={{ fontSize: 16, marginTop: 14 }}>{v.title}</h3>
              <p className="fs-13 text-2" style={{ marginTop: 7, lineHeight: 1.65 }}>{v.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ============ DATA → AI → QAROR → HARAKAT ============
const FLOW = [
  { step: '01', title: 'DATA', sub: 'Ma’lumot', text: 'Savdo, xarid, ombor, ish haqi — barcha ma’lumot avtomatik yig‘iladi.', icon: <Database />, example: 'Savdo ma’lumotlari' },
  { step: '02', title: 'AI TAHLIL', sub: 'Tahlil', text: 'AI o‘zaro bog‘liqlikni topadi: marja, cash flow, qarz va ombor risklari.', icon: <Bot />, example: 'AI savdo pasayishini aniqlaydi' },
  { step: '03', title: 'QAROR', sub: 'Sabab + yechim', text: 'MUAMMO → SABAB → TA’SIR formatida aniq tashxis qo‘yiladi.', icon: <Activity />, example: 'Sabab: xomashyo narxi oshdi' },
  { step: '04', title: 'HARAKAT', sub: 'Bir klik', text: 'Tavsiya bir klikda amalga aylanadi: xarid, eslatma yoki narx o‘zgarishi.', icon: <Sparkles />, example: 'Yetkazib beruvchini solishtiring' },
]

export function FlowSection() {
  return (
    <section className="section" id="platform">
      <Reveal>
        <div className="center">
          <span className="section-tag"><Sparkles style={{ width: 12, height: 12 }} />BALANS AI falsafasi</span>
          <h2 className="section-title">Ma’lumotdan — harakatgacha,<br />to‘rt qadamda.</h2>
          <p className="section-sub" style={{ margin: '14px auto 0' }}>
            BALANS AI faqat raqamlarni ko‘rsatuvchi dashboard emas — u biznesingizni o‘rganadigan va qaror qabul qilishga yordam beradigan aqlli tizim.
          </p>
        </div>
      </Reveal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 44 }} className="flow-grid">
        {FLOW.map((f, i) => (
          <Reveal key={f.step} delay={i * 120}>
            <div className="card card-hover" style={{ height: '100%', position: 'relative', overflow: 'visible' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="kpi-icon">{f.icon}</div>
                <span className="font-display fw-7" style={{ fontSize: 26, color: 'var(--surface-3)', WebkitTextStroke: '1px var(--border-2)' }}>{f.step}</span>
              </div>
              <h3 className="font-display fw-7" style={{ fontSize: 17, marginTop: 16, letterSpacing: '.04em' }}>{f.title}</h3>
              <p className="fs-11 t-accent fw-6" style={{ marginTop: 2 }}>{f.sub}</p>
              <p className="fs-13 text-2" style={{ marginTop: 9, lineHeight: 1.6 }}>{f.text}</p>
              <div style={{ marginTop: 12, padding: '7px 11px', borderRadius: 10, background: 'var(--surface)', border: '1px dashed var(--border-2)', fontSize: 11.5, color: 'var(--text-2)' }}>
                Masalan: {f.example}
              </div>
              {i < 3 && (
                <div style={{ position: 'absolute', right: -13, top: '50%', color: 'var(--accent-2)', animation: 'flowPulse 2.2s infinite', animationDelay: `${i * 0.3}s`, zIndex: 2 }} className="flow-arrow">
                  <ArrowRight style={{ width: 18, height: 18, filter: 'drop-shadow(0 0 6px rgba(139,92,246,.7))' }} />
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>
      <style>{`@media (max-width: 1000px) { .flow-grid { grid-template-columns: 1fr 1fr !important; } .flow-arrow { display: none; } } @media (max-width: 600px) { .flow-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ============ AI CFO ============
export function AICFOSection() {
  return (
    <section className="section" id="ai-cfo">
      <div className="grid-2" style={{ alignItems: 'center', gap: 44 }}>
        <Reveal>
          <div>
            <span className="section-tag"><Bot style={{ width: 12, height: 12 }} />Asosiy farq</span>
            <h2 className="section-title">AI CFO — sizning<br />moliyaviy direktoringiz.</h2>
            <p className="section-sub">
              AI CFO oddiy chatbot emas. U daromad, xarajat, marja, cash flow, qarzdorlik va ombor
              ma’lumotlarini yagona tahlilda birlashtirib, biznes muammolarini erta bosqichda aniqlaydi.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 22 }}>
              {[
                'Daromad, xarajat va foyda tahlili',
                'Marja va cash flow monitoringi',
                'Qarzdorlik va ombor risklarini erta aniqlash',
                'Ishlab chiqarish tannarxini optimallashtirish',
                'MUAMMO → SABAB → TA’SIR → TAVSIYA → ACTION formatida javob',
              ].map((t) => (
                <li key={t} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: 7, background: 'var(--accent-soft)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Check style={{ width: 12, height: 12 }} />
                  </span>
                  <span className="fs-13.5" style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{t}</span>
                </li>
              ))}
            </ul>
            <Link to="/ai-cfo" className="btn btn-primary btn-lg mt-4" style={{ display: 'inline-flex' }}>
              AI CFO’ni sinab ko‘rish <ArrowRight style={{ width: 17, height: 17 }} />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="mockup-frame" style={{ padding: 22 }}>
            <div className="row" style={{ gap: 9, marginBottom: 16 }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-sm)' }}>
                <Bot style={{ width: 17, height: 17, color: '#fff' }} />
              </span>
              <div>
                <p className="fw-7 fs-14">AI CFO</p>
                <p className="fs-11 t-success">● Onlayn — ma’lumotlarni tahlil qilmoqda</p>
              </div>
            </div>

            <div className="chat-bubble-user" style={{ fontSize: 13 }}>Foydam nega kamaydi?</div>

            <div className="chat-bubble-ai" style={{ marginTop: 12 }}>
              <div className="row" style={{ gap: 7, marginBottom: 4 }}>
                <span className="badge badge-warning">Muammo</span>
                <span className="fs-11 text-3">tahlil tugadi • 2.4s</span>
              </div>
              <div className="ai-section"><span className="ai-lbl">Muammo</span><p>Foyda marjasi 2.1% pasaydi.</p></div>
              <div className="ai-section"><span className="ai-lbl">Sabab</span><p>Xomashyo xarajatlari o‘tgan oyga nisbatan 14% oshdi.</p></div>
              <div className="ai-section"><span className="ai-lbl">Ta’sir</span><p>Oy yakunida foyda 8.2% kamayishi mumkin.</p></div>
              <div className="ai-section"><span className="ai-lbl">Tavsiya</span><p>3 ta yetkazib beruvchining narxlarini solishtiring.</p></div>
              <div style={{ marginTop: 12 }}>
                <span className="btn btn-primary btn-sm" style={{ fontSize: 11.5 }}>Yetkazib beruvchilarni ko‘rish</span>
              </div>
            </div>

            <div className="searchbar" style={{ marginTop: 14, padding: '10px 14px' }}>
              <Bot style={{ width: 14, height: 14 }} />
              <span className="fs-12" style={{ color: 'var(--text-3)' }}>BALANS AI’dan so‘rang...</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ============ Modules showcase ============
const MODULES = [
  {
    id: 'dashboard', icon: <BarChart3 />, title: 'Dashboard', tag: 'Boshqaruv',
    text: 'Bugungi savdo, oylik tushum, sof foyda, cash flow, debitor va kreditor — bitta ekranda. KPI kartalar bosilganda tegishli bo‘limga o‘tasiz.',
    points: ['8 ta real-time KPI', 'Tushum/xarajat diagrammasi', 'AI tavsialar paneli'],
  },
  {
    id: 'sales', icon: <ShoppingCart />, title: 'Savdo', tag: 'CRM + Savdo',
    text: 'Buyurtmalar, to‘lovlar holati va mijozlar tarixi. Yangi savdo qo‘shilsa — tushum, ombor qoldig‘i va mijoz tarixi avtomatik yangilanadi.',
    points: ['Buyurtmalar jadvali', 'To‘lov holatlari', 'Avtomatik CRM yangilanishi'],
  },
  {
    id: 'warehouse', icon: <Package />, title: 'Ombor', tag: 'Inventar',
    text: 'Mahsulot qoldiqlari, minimal qoldiq ogohlantirishlari va harakatlar tarixi. Savdo va xaridlar ombor bilan real vaqtda sinxron.',
    points: ['Low-stock ogohlantirish', 'Inventar harakatlari', 'Mahsulot kartochkalari'],
  },
  {
    id: 'production', icon: <Factory />, title: 'Ishlab chiqarish', tag: 'Production',
    text: 'Ishlab chiqarish buyruqlari, xomashyo sarfi va tayyor mahsulot. Buyruq bajarilganda xomashyo kamayadi, tayyor mahsulot omborga tushadi.',
    points: ['Tannarx kalkulyatori', 'Xomashyo avto-sarfi', 'Rejalashtirish'],
  },
  {
    id: 'finance', icon: <Wallet />, title: 'Moliya', tag: 'Finance',
    text: 'Tushum, xarajat, foyda va cash flow diagrammalari. 7 kun / 30 kun / oy filtrlari bilan chuqur moliyaviy tahlil.',
    points: ['Cash flow tahlili', 'Xarajat tarkibi', 'Moliyaviy prognoz'],
  },
  {
    id: 'analytics', icon: <LineChart />, title: 'Analitika', tag: 'BI',
    text: 'Biznes intellekt: mahsulot, toifa va mijozlar kesimida savdo tahlili, marja dinamikasi va xarajat tarkibi.',
    points: ['Mahsulot reytingi', 'Mijozlar analitikasi', 'Marja dinamikasi'],
  },
]

export function ModulesSection() {
  return (
    <section className="section" id="modules">
      <Reveal>
        <div className="center">
          <span className="section-tag"><Boxes style={{ width: 12, height: 12 }} />Imkoniyatlar</span>
          <h2 className="section-title">Yagona ekotizim.<br />Hech qanday uzilish yo‘q.</h2>
          <p className="section-sub" style={{ margin: '14px auto 0' }}>
            Har bir modul boshqalari bilan ma’lumot almashadi: savdo omborni, xarid moliyani,
            ishlab chiqarish tannarxni avtomatik yangilaydi.
          </p>
        </div>
      </Reveal>

      <div className="grid-3" style={{ marginTop: 44 }}>
        {MODULES.map((m, i) => (
          <Reveal key={m.id} delay={(i % 3) * 90}>
            <div className="card card-hover" id={i === 3 ? 'production' : undefined} style={{ height: '100%' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="kpi-icon">{m.icon}</div>
                <span className="badge badge-neutral">{m.tag}</span>
              </div>
              <h3 style={{ fontSize: 17, marginTop: 15 }}>{m.title}</h3>
              <p className="fs-13 text-2" style={{ marginTop: 7, lineHeight: 1.65 }}>{m.text}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 14 }}>
                {m.points.map((p) => (
                  <div key={p} className="row" style={{ gap: 8 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 5, background: 'var(--accent-soft)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check style={{ width: 10, height: 10 }} />
                    </span>
                    <span className="fs-12 text-2">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ============ Roles ============
export function RolesSection() {
  const roles = Object.keys(ROLE_LABELS) as Role[]
  return (
    <section className="section">
      <div className="grid-2" style={{ alignItems: 'center', gap: 40 }}>
        <Reveal>
          <div>
            <span className="section-tag"><UserCog style={{ width: 12, height: 12 }} />Rol asosida kirish</span>
            <h2 className="section-title">Har bir xodim — o‘z oynasidan ko‘radi.</h2>
            <p className="section-sub">
              Egasi hamma narsani ko‘radi. Buxgalter faqat moliyani, sotuvchi savdoni, omborchi omborni.
              Ruxsatlar modul, harakat (ko‘rish/yaratish/tahrirlash/o‘chirish) darajasida boshqariladi.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {roles.map((r) => (
                <div key={r} className="stat-mini" style={{ padding: '12px 14px', cursor: 'default' }}>
                  <span className="fw-6 fs-13">{ROLE_LABELS[r]}</span>
                  <span className="badge badge-accent" style={{ fontSize: 9.5 }}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'var(--accent-soft)', border: '1px solid rgba(139,92,246,.25)' }}>
              <p className="fs-12" style={{ lineHeight: 1.6, color: 'var(--text-2)' }}>
                <b className="t-accent">Egasi (OWNER):</b> {ROLE_DESCRIPTIONS.OWNER}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ============ Security ============
export function SecuritySection() {
  const items = [
    { icon: <Lock />, title: 'Xavfsiz autentifikatsiya', text: 'Parol siyosati va sessiya nazorati bilan himoyalangan kirish.' },
    { icon: <ShieldCheck />, title: 'Rol asosida kirish', text: 'Har bir modul va harakat uchun aniq ruxsat matritsasi.' },
    { icon: <Eye />, title: 'Faoliyat jurnali', text: 'Kim, qachon, nima qilgani — barchasi activity log’da.' },
    { icon: <FileCheck />, title: 'Audit izlari', text: 'Moliyaviy amallar izchil va kuzatiladigan tarixda saqlanadi.' },
    { icon: <KeyRound />, title: 'Himoyalangan marshrutlar', text: 'Ruxsatsiz foydalanuvchi ichki sahifalarga kira olmaydi.' },
    { icon: <Server />, title: 'Ma’lumot himoyasi', text: 'Ma’lumotlar shifrlangan holda saqlanadi va zaxiralanadi.' },
  ]
  return (
    <section className="section" id="security">
      <Reveal>
        <div className="center">
          <span className="section-tag"><ShieldCheck style={{ width: 12, height: 12 }} />Xavfsizlik</span>
          <h2 className="section-title">Biznes ma’lumotlari —<br />moliya sektori darajasida himoyada.</h2>
        </div>
      </Reveal>
      <div className="grid-3" style={{ marginTop: 40 }}>
        {items.map((s, i) => (
          <Reveal key={s.title} delay={(i % 3) * 80}>
            <div className="card card-hover" style={{ height: '100%' }}>
              <div className="kpi-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>{s.icon}</div>
              <h3 style={{ fontSize: 15, marginTop: 14 }}>{s.title}</h3>
              <p className="fs-13 text-2" style={{ marginTop: 6, lineHeight: 1.6 }}>{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ============ Pricing ============
export function PricingSection({ onChoose }: { onChoose: (plan: 'PREMIUM' | 'BIZNES') => void }) {
  const [yearly, setYearly] = useState(false)
  const plans = [
    {
      name: 'PREMIUM', monthly: 499000, featured: false,
      desc: 'Kichik va o‘rta biznes uchun to‘liq boshqaruv.',
      features: ['5 foydalanuvchi', 'AI CFO — 100 so‘rov/oy', 'Buxgalteriya va moliya', 'Savdo va mijozlar', 'Ombor boshqaruvi', 'Hisobotlar va eksport', 'Email qo‘llab-quvvatlash'],
    },
    {
      name: 'BIZNES', monthly: 999000, featured: true,
      desc: 'Ishlab chiqarish va yirik jamoalar uchun.',
      features: ['Foydalanuvchilar cheksiz', 'AI CFO — cheksiz', 'Ishlab chiqarish moduli', 'Tannarx kalkulyatori', 'Xaridlar va yetkazib beruvchilar', 'HR va ish haqi', 'Analitika (BI)', 'Prioritet qo‘llab-quvvatlash'],
    },
  ]
  return (
    <section className="section" id="pricing">
      <Reveal>
        <div className="center">
          <span className="section-tag"><ScrollText style={{ width: 12, height: 12 }} />Narxlar</span>
          <h2 className="section-title">Oddiy va shaffof tariflar.</h2>
          <p className="section-sub" style={{ margin: '14px auto 0' }}>30 kun bepul sinab ko‘ring. Karta talab qilinmaydi.</p>

          <div className="tabs mt-3" style={{ margin: '18px auto 0' }}>
            <button className={`tab ${!yearly ? 'active' : ''}`} onClick={() => setYearly(false)}>Oylik</button>
            <button className={`tab ${yearly ? 'active' : ''}`} onClick={() => setYearly(true)}>
              Yillik <span className="badge badge-success" style={{ fontSize: 9.5, padding: '2px 7px' }}>−20%</span>
            </button>
          </div>
        </div>
      </Reveal>

      <div className="grid-2" style={{ marginTop: 40, maxWidth: 880, marginInline: 'auto' }}>
        {plans.map((p, i) => (
          <Reveal key={p.name} delay={i * 110}>
            <div className="card" style={{
              height: '100%', padding: 28,
              border: p.featured ? '1px solid rgba(139,92,246,.45)' : undefined,
              boxShadow: p.featured ? 'var(--glow)' : undefined,
              position: 'relative',
            }}>
              {p.featured && (
                <span className="badge badge-accent" style={{ position: 'absolute', top: 22, right: 22 }}>Eng mashhur</span>
              )}
              <p className="font-display fw-7" style={{ fontSize: 13, letterSpacing: '.14em', color: p.featured ? 'var(--accent-2)' : 'var(--text-2)' }}>{p.name}</p>
              <div className="row" style={{ alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                <span className="font-display fw-7 mono" style={{ fontSize: 36 }}>
                  {formatCompact(yearly ? Math.round(p.monthly * 0.8) : p.monthly)}
                </span>
                <span className="fs-13 text-2">so‘m / oy</span>
              </div>
              {yearly && <p className="fs-11 t-success">Yillik to‘lovda 20% tejamkorlik</p>}
              <p className="fs-13 text-2" style={{ marginTop: 10 }}>{p.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18 }}>
                {p.features.map((f) => (
                  <div key={f} className="row" style={{ gap: 9 }}>
                    <span style={{ width: 17, height: 17, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check style={{ width: 11, height: 11 }} />
                    </span>
                    <span className="fs-13 text-2">{f}</span>
                  </div>
                ))}
              </div>
              <button className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'} btn-lg mt-3`} style={{ width: '100%' }} onClick={() => onChoose(p.name as 'PREMIUM' | 'BIZNES')}>
                30 kun bepul boshlash
              </button>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ============ FAQ ============
export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0)
  const faqs = [
    { q: 'BALANS AI bu nima?', a: 'BALANS AI — O‘zbekiston bizneslari uchun AI-powered buxgalteriya, moliya va biznes boshqaruv platformasi. Buxgalteriya, savdo, CRM, ombor, xaridlar, ishlab chiqarish, HR, hisobotlar va analitika bitta tizimda birlashtirilgan.' },
    { q: 'AI CFO qanday ishlaydi?', a: 'AI CFO barcha modullardagi ma’lumotlarni real vaqtda tahlil qiladi va muammolarni MUAMMO → SABAB → TA’SIR → TAVSIYA → ACTION formatida tushuntiradi. Har bir tavsia bir klikda amalga aylanadi.' },
    { q: 'Boshqa buxgalteriya dasturlaridan farqi nima?', a: 'BALANS AI faqat hisob kitob emas — modullar bir-biri bilan bog‘langan: savdo ombor qoldig‘ini, xarid moliyani, ishlab chiqarish tannarxni avtomatik yangilaydi. Siz nima qilayotganingizni emas, nima qilish kerakligini ko‘rasiz.' },
    { q: '30 kunlik trial qanday ishlaydi?', a: 'Ro‘yxatdan o‘tganingizdan so‘ng barcha funksiyalar 30 kun davomida bepul. Karta ma’lumoti talab qilinmaydi. Trial tugashidan oldin eslatma olasiz — xohlasangiz tarifni tanlaysiz, xohlasangiz hech narsa to‘lamaysiz.' },
    { q: 'Xodimlarim uchun ruxsatlarni qanday boshqaraman?', a: 'Sozlamalar → Foydalanuvchilar bo‘limida har bir xodimga rol tayinlaysiz (Buxgalter, Sotuvchi, Omborchi va h.k.). Har bir rol faqat o‘ziga tegishli modul va amallarni ko‘radi.' },
    { q: 'Ma’lumotlarim xavfsizmi?', a: 'Ha. Rol asosida kirish nazorati, faoliyat va audit jurnallari, himoyalangan marshrutlar va muntazam zaxiralash bilan ma’lumotlaringiz moliya sektori talablariga muvofiq himoyalanadi.' },
  ]
  return (
    <section className="section" id="faq" style={{ maxWidth: 820 }}>
      <Reveal>
        <div className="center">
          <span className="section-tag">FAQ</span>
          <h2 className="section-title">Ko‘p beriladigan savollar.</h2>
        </div>
      </Reveal>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 36 }}>
        {faqs.map((f, i) => (
          <Reveal key={i} delay={i * 60}>
            <div className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setOpen(open === i ? null : i)}>
              <div className="row-between" style={{ padding: '17px 22px' }}>
                <h3 style={{ fontSize: 15 }}>{f.q}</h3>
                <ChevronDown style={{
                  width: 17, height: 17, color: 'var(--text-3)', flexShrink: 0,
                  transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .3s',
                }} />
              </div>
              <div style={{
                maxHeight: open === i ? 200 : 0, overflow: 'hidden', transition: 'max-height .35s ease',
                padding: open === i ? '0 22px 18px' : '0 22px',
              }}>
                <p className="fs-13 text-2" style={{ lineHeight: 1.7 }}>{f.a}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
