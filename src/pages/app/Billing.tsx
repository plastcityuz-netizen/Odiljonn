import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Check, CreditCard, Download, Sparkles, XCircle, Zap } from 'lucide-react'
import { useData } from '../../lib/store'
import { useAuth } from '../../lib/auth'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button } from '../../components/ui/primitives'
import { ConfirmDialog, Modal } from '../../components/ui/modals'
import { useToast } from '../../components/ui/toast'
import { formatCompact, formatDate } from '../../lib/utils'
import { uid } from '../../lib/utils'

export default function Billing() {
  const { data, dispatch } = useData()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [yearly, setYearly] = useState(data.plan.cycle === 'yearly')
  const [upgradeTo, setUpgradeTo] = useState<null | 'PREMIUM' | 'BIZNES'>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  const trialDaysLeft = Math.max(0, Math.ceil((new Date(data.plan.trialEndsAt).getTime() - Date.now()) / 86400000))
  const plan = data.plan

  const PLANS = {
    PREMIUM: { name: 'PREMIUM', monthly: 499000, features: ['5 foydalanuvchi', 'AI CFO — 100 so‘rov/oy', 'Buxgalteriya va moliya', 'Savdo va mijozlar', 'Ombor boshqaruvi', 'Hisobotlar va eksport'] },
    BIZNES: { name: 'BIZNES', monthly: 999000, features: ['Foydalanuvchilar cheksiz', 'AI CFO — cheksiz', 'Ishlab chiqarish moduli', 'Tannarx kalkulyatori', 'Xaridlar va HR', 'Analitika (BI)'] },
  } as const

  const price = (p: (typeof PLANS)[keyof typeof PLANS]) => (yearly ? Math.round(p.monthly * 0.8) : p.monthly)

  const changePlan = (name: 'PREMIUM' | 'BIZNES') => {
    setProcessing(true)
    setTimeout(() => {
      dispatch({
        type: 'UPDATE_PLAN',
        plan: {
          name, cycle: yearly ? 'yearly' : 'monthly',
          nextPayment: new Date(Date.now() + (yearly ? 365 : 30) * 86400000).toISOString(),
          invoices: [
            { id: uid('inv'), number: `INV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`, date: new Date().toISOString(), amount: price(PLANS[name]), status: 'paid' as const, plan: `${name} (${yearly ? 'yillik' : 'oylik'})` },
            ...plan.invoices,
          ],
        },
      })
      toast('success', `Tarif o‘zgartirildi: ${name}`, `${formatCompact(price(PLANS[name]))} so‘m / ${yearly ? 'yil' : 'oy'}`)
      setProcessing(false)
      setUpgradeTo(null)
    }, 900)
  }

  return (
    <div className="page">
      <PageHeader
        title="To‘lovlar va tarif"
        sub="Tariflarni boshqaring, to‘lov tarixini ko‘ring."
      />

      {/* current plan status */}
      <div className="card mb-3" style={{
        background: 'linear-gradient(130deg, rgba(139,92,246,.14), rgba(232,121,249,.05))',
        border: '1px solid rgba(139,92,246,.35)',
      }}>
        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="row" style={{ gap: 10 }}>
              <span style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-sm)' }}>
                <Zap style={{ width: 20, height: 20, color: '#fff' }} />
              </span>
              <div>
                <p className="font-display fw-7" style={{ fontSize: 19 }}>{plan.name === 'TRIAL' ? 'TRIAL — 30 kun bepul' : `Tarif: ${plan.name}`}</p>
                <p className="fs-12 text-2">
                  {plan.name === 'TRIAL'
                    ? `Trial davom etmoqda — ${trialDaysLeft} kun qoldi`
                    : `Keyingi to‘lov: ${formatDate(plan.nextPayment)} • ${plan.cycle === 'yearly' ? 'yillik' : 'oylik'}`}
                </p>
              </div>
            </div>
          </div>
          <div className="row wrap">
            {plan.name !== 'BIZNES' && (
              <Button variant="primary" onClick={() => setUpgradeTo(plan.name === 'TRIAL' ? 'PREMIUM' : 'BIZNES')}>
                <ArrowUpRight style={{ width: 15, height: 15 }} />{plan.name === 'TRIAL' ? 'Tarif tanlash' : 'Yaxshilash'}
              </Button>
            )}
            {plan.name !== 'TRIAL' && (
              <>
                {plan.name === 'BIZNES' && (
                  <Button onClick={() => setUpgradeTo('PREMIUM')}><ArrowDownRight style={{ width: 15, height: 15 }} />Pasaytirish</Button>
                )}
                <Button variant="ghost" className="t-danger" onClick={() => setCancelOpen(true)}><XCircle style={{ width: 15, height: 15 }} />Bekor qilish</Button>
              </>
            )}
          </div>
        </div>

        {plan.name === 'TRIAL' && (
          <div className="mt-3">
            <div className="row-between fs-12 mb-1">
              <span className="text-2">Trial muddati</span>
              <span className="mono fw-6">{30 - trialDaysLeft} / 30 kun</span>
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${((30 - trialDaysLeft) / 30) * 100}%` }} /></div>
          </div>
        )}
      </div>

      {/* cycle toggle */}
      <div className="center mb-3">
        <div className="tabs">
          <button className={`tab ${!yearly ? 'active' : ''}`} onClick={() => setYearly(false)}>Oylik</button>
          <button className={`tab ${yearly ? 'active' : ''}`} onClick={() => setYearly(true)}>
            Yillik <Badge variant="success" style={{ fontSize: 9.5, padding: '1px 7px' }}>−20%</Badge>
          </button>
        </div>
      </div>

      {/* plans */}
      <div className="grid-2" style={{ maxWidth: 880, margin: '0 auto' }}>
        {(['PREMIUM', 'BIZNES'] as const).map((key) => {
          const p = PLANS[key]
          const current = plan.name === key
          return (
            <div key={key} className="card" style={{
              padding: 26,
              border: current ? '1px solid rgba(139,92,246,.5)' : key === 'BIZNES' ? '1px solid rgba(232,121,249,.35)' : undefined,
              boxShadow: current ? 'var(--glow)' : undefined,
              position: 'relative',
            }}>
              {current && <span className="badge badge-accent" style={{ position: 'absolute', top: 20, right: 20 }}>Joriy tarif</span>}
              <p className="font-display fw-7" style={{ fontSize: 13, letterSpacing: '.14em', color: key === 'BIZNES' ? 'var(--pink)' : 'var(--accent-2)' }}>{p.name}</p>
              <div className="row" style={{ alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                <span className="font-display fw-7 mono" style={{ fontSize: 32 }}>{formatCompact(price(p))}</span>
                <span className="fs-12 text-2">so‘m / {yearly ? 'oy (yillik to‘lovda)' : 'oy'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {p.features.map((f) => (
                  <div key={f} className="row" style={{ gap: 8 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 5, background: 'var(--accent-soft)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check style={{ width: 10, height: 10 }} />
                    </span>
                    <span className="fs-13 text-2">{f}</span>
                  </div>
                ))}
              </div>
              <Button
                variant={current ? 'ghost' : 'primary'}
                className="mt-3"
                style={{ width: '100%' }}
                disabled={current}
                onClick={() => setUpgradeTo(key)}
              >
                {current ? 'Joriy tarif' : plan.name === 'TRIAL' ? 'Bu tarifni tanlash' : key === 'BIZNES' ? 'Yaxshilash' : "O'tish"}
              </Button>
            </div>
          )
        })}
      </div>

      {/* invoices */}
      <div className="card mt-3">
        <div className="row-between wrap mb-2">
          <p className="card-title">To‘lov tarixi va hisob-fakturalar</p>
          <Button size="sm" onClick={() => toast('success', 'Barcha hisob-fakturalar eksport qilindi.', 'billing-history.csv')}><Download />Export</Button>
        </div>
        <div className="table-wrap has-cards">
          <table className="table">
            <thead><tr><th>Raqam</th><th>Sana</th><th>Tarif</th><th className="right">Summa</th><th>Holat</th><th /></tr></thead>
            <tbody>
              {plan.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="mono fw-6 fs-13">{inv.number}</td>
                  <td className="fs-12 mono text-2">{formatDate(inv.date)}</td>
                  <td className="fs-12 text-2">{inv.plan}</td>
                  <td className="right mono fw-6">{inv.amount === 0 ? 'Bepul' : `${formatCompact(inv.amount)} so‘m`}</td>
                  <td><Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>{inv.status === 'paid' ? 'To‘langan' : 'Kutilmoqda'}</Badge></td>
                  <td className="right">
                    <Button size="sm" variant="ghost" onClick={() => toast('success', `${inv.number} yuklab olindi.`, 'PDF hisob-faktura')}><Download /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-cards">
            {plan.invoices.map((inv) => (
              <div key={inv.id} className="table-card-item">
                <div className="table-card-row"><span className="table-card-label">Raqam</span><span className="mono fw-6">{inv.number}</span></div>
                <div className="table-card-row"><span className="table-card-label">Tarif</span><span>{inv.plan}</span></div>
                <div className="table-card-row"><span className="table-card-label">Summa</span><span className="mono">{inv.amount === 0 ? 'Bepul' : formatCompact(inv.amount)}</span></div>
                <div className="table-card-row"><span className="table-card-label">Holat</span><span>{inv.status === 'paid' ? 'To‘langan' : 'Kutilmoqda'}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* payment method */}
      <div className="card mt-3">
        <p className="card-title mb-2"><CreditCard style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />To‘lov usuli</p>
        <div className="row wrap" style={{ gap: 10 }}>
          {['Payme', 'Click', 'Uzum Bank', 'Bank karta'].map((m, i) => (
            <button key={m} className="chip" style={{ padding: '9px 16px' }} onClick={() => toast('info', `${m} orqali to‘lov`, 'Demo muhitda to‘lov simulyatsiya qilinadi')}>
              {m}{i === 0 ? ' ★' : ''}
            </button>
          ))}
        </div>
        <p className="fs-12 text-3 mt-2">Trial davrida karta talab qilinmaydi. {user?.name} sifatida kiritdingiz.</p>
      </div>

      {/* upgrade modal */}
      <Modal
        open={!!upgradeTo} onClose={() => setUpgradeTo(null)}
        title={upgradeTo === 'BIZNES' && plan.name === 'BIZNES' ? 'PREMIUM’ga o‘tish' : `Tarifni yangilash: ${upgradeTo ?? ''}`}
        footer={
          <>
            <Button onClick={() => setUpgradeTo(null)}>Bekor qilish</Button>
            <Button variant="primary" loading={processing} onClick={() => upgradeTo && changePlan(upgradeTo)}>
              <Sparkles style={{ width: 14, height: 14 }} />Tasdiqlash
            </Button>
          </>
        }
      >
        {upgradeTo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="stat-mini">
              <span className="text-2 fs-13">Yangi tarif</span>
              <span className="fw-7 fs-14 font-display">{upgradeTo}</span>
            </div>
            <div className="stat-mini">
              <span className="text-2 fs-13">Summa</span>
              <span className="mono fw-6">{formatCompact(price(PLANS[upgradeTo]))} so‘m / {yearly ? 'yil' : 'oy'}</span>
            </div>
            <div className="stat-mini">
              <span className="text-2 fs-13">Birinchi to‘lov</span>
              <span className="mono fs-13">{formatDate(new Date().toISOString())}</span>
            </div>
            <p className="fs-12 text-3" style={{ lineHeight: 1.6 }}>
              Tasdiqlash bilan tarif darhol faollashadi. Istalgan vaqtda pasaytirish yoki bekor qilish mumkin.
            </p>
          </div>
        )}
      </Modal>

      {/* cancel modal */}
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Obunani bekor qilish"
        message="Tarif bekor qilingach, hisobingiz trial holatiga qaytadi va ayrim funksiyalar cheklanadi. Davom etasizmi?"
        confirmLabel="Bekor qilish"
        onConfirm={() => {
          dispatch({
            type: 'UPDATE_PLAN',
            plan: { name: 'TRIAL', cycle: 'monthly', trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(), nextPayment: new Date(Date.now() + 7 * 86400000).toISOString() },
          })
          toast('delete', 'Obuna bekor qilindi.', 'Trial holatiga qaytdi — 7 kun')
          setCancelOpen(false)
        }}
      />
    </div>
  )
}
