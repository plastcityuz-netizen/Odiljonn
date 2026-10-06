import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Bot, ChevronRight, Clock, History, Send, Sparkles, TrendingUp, Zap,
} from 'lucide-react'
import { useData } from '../../lib/store'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button } from '../../components/ui/primitives'
import { formatCompact, formatUZS, timeAgo } from '../../lib/utils'
import { aiAnswer, buildInsights, QUICK_PROMPTS, type AIAnswer } from '../../lib/ai'
import { cashFlow, healthScore, monthExpense, monthIncome, receivables } from '../../lib/analytics'
import { ProgressRing } from '../../components/charts/Charts'

interface ChatMessage {
  id: number
  role: 'user' | 'ai'
  text?: string
  answer?: AIAnswer
  pending?: boolean
}

const SEV: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  good: { label: 'Ijobiy', variant: 'success' },
  warn: { label: 'Diqqat', variant: 'warning' },
  bad: { label: 'Muammo', variant: 'danger' },
  info: { label: 'Ma’lumot', variant: 'info' },
}

export default function AICFO() {
  const { data } = useData()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const counter = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const insights = useMemo(() => buildInsights(data), [data])
  const hs = useMemo(() => healthScore(data), [data])
  const inc = monthIncome(data.transactions)
  const exp = monthExpense(data.transactions)
  const rec = receivables(data)

  const scrollDown = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current as (HTMLElement & { scrollTo?: (o: { top: number; behavior?: ScrollBehavior }) => void }) | null
      el?.scrollTo?.({ top: el.scrollHeight, behavior: 'smooth' })
    })
  }

  useEffect(scrollDown, [messages, thinking])

  const ask = (prompt: string) => {
    if (!prompt.trim() || thinking) return
    const id = ++counter.current
    setMessages((m) => [...m, { id, role: 'user', text: prompt }])
    setInput('')
    setThinking(true)
    const answer = aiAnswer(data, prompt)
    setTimeout(() => {
      setMessages((m) => [...m, { id: id + 0.5, role: 'ai', answer }])
      setThinking(false)
    }, 1100 + Math.min(1200, answer.sections.length * 300))
  }

  const suggested = QUICK_PROMPTS.slice(0, 5)

  return (
    <div className="page">
      <PageHeader
        title="AI CFO"
        sub="Biznesingizning aqlli moliyaviy direktori — ma’lumotlaringiz asosida tahlil, tashxis va tavsiya beradi."
        actions={<Button size="sm" onClick={() => setMessages([])}><History />Yangi suhbat</Button>}
      />

      {/* Financial status bar */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="card kpi" onClick={() => navigate('/finance')} role="button" tabIndex={0}>
          <div className="kpi-icon"><TrendingUp /></div>
          <div className="kpi-label">Oylik tushum</div>
          <div className="kpi-value">{formatCompact(inc)}</div>
          <span className="kpi-delta up"><Sparkles style={{ width: 11, height: 11 }} />real vaqtda</span>
        </div>
        <div className="card kpi">
          <div className="kpi-icon" style={{ background: 'var(--pink-soft)', color: 'var(--pink)' }}><Zap /></div>
          <div className="kpi-label">Oylik xarajat</div>
          <div className="kpi-value">{formatCompact(exp)}</div>
          <span className="kpi-delta down">shu oy</span>
        </div>
        <div className="card kpi">
          <div className="kpi-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><Sparkles /></div>
          <div className="kpi-label">Cash flow</div>
          <div className="kpi-value">{formatCompact(cashFlow(data.transactions))}</div>
          <span className="kpi-delta up">jami balans</span>
        </div>
        <div className="card kpi" onClick={() => navigate('/debts')} role="button" tabIndex={0}>
          <div className="kpi-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}><Clock /></div>
          <div className="kpi-label">Kutilayotgan to‘lov</div>
          <div className="kpi-value">{formatCompact(rec.reduce((s, r) => s + r.remaining, 0))}</div>
          <span className="kpi-delta down">{rec.length} ta buyurtma</span>
        </div>
      </div>

      <div className="grid-2 mt-3" style={{ gridTemplateColumns: '1.75fr 1fr', alignItems: 'stretch' }}>
        {/* Chat */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 560, padding: 0, overflow: 'hidden' }}>
          <div className="row" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', gap: 11 }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-sm)' }}>
              <Bot style={{ width: 18, height: 18, color: '#fff' }} />
            </span>
            <div className="flex-1">
              <p className="card-title">AI CFO suhbati</p>
              <p className="card-sub">{data.company.name} ma’lumotlari bilan bog‘langan</p>
            </div>
            <Badge variant="success">● Onlayn</Badge>
          </div>

          <div className="chat-scroll" ref={scrollRef} style={{ flex: 1, padding: '18px 20px', maxHeight: 430 }}>
            {messages.length === 0 && (
              <div className="center" style={{ padding: '34px 10px' }}>
                <div style={{
                  width: 62, height: 62, borderRadius: 20, background: 'var(--grad)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: 'var(--glow)', animation: 'pulseGlow 2.6s infinite',
                }}>
                  <Bot style={{ width: 28, height: 28, color: '#fff' }} />
                </div>
                <h3 style={{ fontSize: 17 }}>BALANS AI’dan so‘rang</h3>
                <p className="fs-13 text-2" style={{ marginTop: 7, maxWidth: 380, marginInline: 'auto', lineHeight: 1.65 }}>
                  Men barcha modullaringiz ma’lumotlarini tahlil qilaman: savdo, ombor, xaridlar,
                  ishlab chiqarish va moliya. Muammoni topaman, sababini tushuntiraman va yechimni tavsiya qilaman.
                </p>
              </div>
            )}

            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="chat-bubble-user">{m.text}</div>
              ) : (
                <div key={m.id} className="chat-bubble-ai">
                  {m.answer && (
                    <>
                      <div className="row" style={{ gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span className="fw-7 fs-14 font-display">{m.answer.title}</span>
                        <Badge variant={SEV[m.answer.severity].variant}>{SEV[m.answer.severity].label}</Badge>
                      </div>
                      {m.answer.sections.map((s, i) => (
                        <div className="ai-section" key={i}>
                          <span className="ai-lbl">{s.label}</span>
                          <p>{s.text}</p>
                        </div>
                      ))}
                      {m.answer.action && (
                        <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate(m.answer!.action!.to)}>
                          {m.answer.action.label} <ArrowRight style={{ width: 13, height: 13 }} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            )}

            {thinking && (
              <div className="chat-bubble-ai" style={{ width: 'fit-content' }}>
                <div className="row" style={{ gap: 10 }}>
                  <div className="typing-dots"><span /><span /><span /></div>
                  <span className="fs-12 text-2">AI ma’lumotlarni tahlil qilmoqda...</span>
                </div>
              </div>
            )}
          </div>

          {/* suggested prompts */}
          <div className="chip-row" style={{ padding: '10px 20px 0', gap: 7 }}>
            {suggested.map((p) => (
              <button key={p} className="chip" onClick={() => ask(p)}>{p}</button>
            ))}
          </div>

          {/* input */}
          <form
            style={{ padding: '12px 20px 18px' }}
            onSubmit={(e) => { e.preventDefault(); ask(input) }}
          >
            <div className="searchbar" style={{ padding: '12px 15px', border: '1px solid rgba(139,92,246,.35)', boxShadow: 'var(--glow-sm)' }}>
              <Bot style={{ width: 16, height: 16, color: 'var(--accent-2)' }} />
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="BALANS AI’dan so‘rang..."
                style={{ fontSize: 14 }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={!input.trim() || thinking} aria-label="Yuborish" style={{ padding: '7px 11px' }}>
                <Send style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </form>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="card-title" style={{ textAlign: 'left' }}>Financial Health Score</p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
              <ProgressRing value={hs.score} size={132} label="ball / 100" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              {hs.parts.map((p) => (
                <div key={p.label}>
                  <div className="row-between fs-12" style={{ marginBottom: 3 }}>
                    <span className="text-2">{p.label}</span>
                    <span className="mono fw-6">{p.score}/{p.max}</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${(p.score / p.max) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <p className="card-title mb-2">Bugungi tavsialar</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {insights.slice(0, 4).map((ins) => (
                <button
                  key={ins.id}
                  className="card card-hover"
                  style={{ textAlign: 'left', background: 'var(--surface)', boxShadow: 'none', padding: 13, cursor: 'pointer' }}
                  onClick={() => ask(ins.title)}
                >
                  <div className="row" style={{ gap: 7 }}>
                    <Badge variant={SEV[ins.severity].variant} style={{ fontSize: 9.5 }}>{SEV[ins.severity].label}</Badge>
                    <span className="fw-6 fs-12.5" style={{ fontSize: 12.5, flex: 1 }}>{ins.title}</span>
                  </div>
                  <p className="fs-11.5 text-2" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ins.message}
                  </p>
                  <span className="link-accent" style={{ fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 7 }}>
                    Tahlil qilish <ChevronRight style={{ width: 11, height: 11 }} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="card-title mb-2">Tezkor harakatlar</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { label: 'Yangi savdo yaratish', to: '/sales?new=1' },
                { label: 'Xarid buyurtmasi', to: '/purchases?new=1' },
                { label: 'Xarajat qo‘shish', to: '/accounting?new=expense' },
                { label: 'Qarz eslatmasi yuborish', to: '/debts' },
              ].map((a) => (
                <button key={a.to} className="sidebar-item" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }} onClick={() => navigate(a.to)}>
                  <Sparkles style={{ width: 14, height: 14, color: 'var(--accent-2)' }} />
                  <span className="fs-12.5" style={{ fontSize: 12.5 }}>{a.label}</span>
                  <ChevronRight style={{ width: 13, height: 13, marginLeft: 'auto', color: 'var(--text-3)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* conversation history */}
      {messages.length > 0 && (
        <div className="card mt-3">
          <p className="card-title mb-2">Suhbat tarixi</p>
          <div className="table-wrap has-cards">
            <table className="table">
              <thead><tr><th>Savol</th><th>Tashxis</th><th>Vaqt</th></tr></thead>
              <tbody>
                {messages.filter((m) => m.role === 'user').reverse().map((m, i) => {
                  const ans = messages.find((x) => x.role === 'ai' && x.id === m.id + 0.5)
                  return (
                    <tr key={m.id}>
                      <td className="fw-6 fs-13" style={{ maxWidth: 320 }}>{m.text}</td>
                      <td className="fs-13 text-2">{ans?.answer?.title ?? '—'}</td>
                      <td className="fs-12 text-3">{timeAgo(new Date(Date.now() - i * 240000).toISOString())}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@media (max-width: 1100px) { .grid-2[style*="1.75fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
