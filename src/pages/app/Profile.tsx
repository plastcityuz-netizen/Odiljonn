import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Bot, KeyRound, Save, Shield } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { useData } from '../../lib/store'
import { PageHeader } from '../../components/ui/PageHeader'
import { Avatar, Badge, Button, Field, Input } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/toast'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../lib/permissions'
import { timeAgo } from '../../lib/utils'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { data } = useData()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: user?.name ?? '', email: user?.email ?? '',
    phone: user?.phone ?? '', position: user?.position ?? '',
  })

  const myActivity = data.activity.slice(0, 8)

  return (
    <div className="page">
      <PageHeader title="Profil" sub="Shaxsiy ma’lumotlaringiz va tizimdagi faoliyatingiz." />

      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <div className="card">
          <div className="row mb-3" style={{ gap: 16 }}>
            <Avatar name={form.name || 'Foydalanuvchi'} size={64} />
            <div>
              <p className="font-display fw-7" style={{ fontSize: 18 }}>{form.name || 'Foydalanuvchi'}</p>
              <p className="fs-12 text-3">{user?.email}</p>
              <div className="row mt-1" style={{ gap: 7 }}>
                <Badge variant="accent">{ROLE_LABELS[user?.role ?? 'OWNER']}</Badge>
                {user?.position && <Badge variant="neutral">{user.position}</Badge>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid-2">
              <Field label="Ism va familiya" required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Telefon">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 ..." />
              </Field>
              <Field label="Lavozim">
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </Field>
            </div>
            <div className="row">
              <Button variant="primary" onClick={() => {
                if (form.name.trim().length < 2) return toast('error', 'Ismni kiriting.')
                updateUser({ name: form.name.trim(), email: form.email, phone: form.phone, position: form.position })
                toast('success', 'Profil saqlandi.')
              }}><Save />Saqlash</Button>
              <Button onClick={() => navigate('/settings?tab=security')}><KeyRound />Parolni o‘zgartirish</Button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <p className="card-title mb-2"><Shield style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />Rol va ruxsatlar</p>
            <p className="fs-13 text-2" style={{ lineHeight: 1.65 }}>{ROLE_DESCRIPTIONS[user?.role ?? 'OWNER']}</p>
            <div className="row mt-2" style={{ gap: 8 }}>
              <Button size="sm" onClick={() => navigate('/settings?tab=roles')}>Rollar</Button>
              <Button size="sm" onClick={() => navigate('/settings?tab=permissions')}>Ruxsatlar matritsasi</Button>
            </div>
          </div>

          <div className="card">
            <p className="card-title mb-2"><Bot style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />AI CFO’ga tez savollar</p>
            <div className="chip-row">
              {['Bugungi tahlil', 'Foyda qanday?', 'Qarzlar holati'].map((q) => (
                <button key={q} className="chip" onClick={() => navigate('/ai-cfo')}>{q}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-3">
        <p className="card-title mb-2"><Activity style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />Faoliyat jurnali</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {myActivity.map((a) => (
            <div key={a.id} className="row-between" style={{ padding: '11px 2px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="fs-13 fw-6">{a.action}</p>
                <p className="fs-11 text-3">{a.user}</p>
              </div>
              <span className="fs-11 text-3">{timeAgo(a.time)}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@media (max-width: 1000px) { .grid-2[style*="1.2fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
