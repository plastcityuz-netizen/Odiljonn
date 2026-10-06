import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass, Home } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Button } from '../components/ui/primitives'

export default function NotFound() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  return (
    <div className="landing" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div className="hero-bg" style={{ position: 'fixed', inset: 0 }} aria-hidden>
        <div className="beam" />
        <div className="grid-lines" />
      </div>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 520 }}>
        <div style={{
          width: 92, height: 92, borderRadius: 28, background: 'var(--grad)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px',
          boxShadow: 'var(--glow)', animation: 'pulseGlow 3s infinite',
        }}>
          <Compass style={{ width: 42, height: 42, color: '#fff' }} />
        </div>
        <p className="font-display fw-7 grad-text" style={{ fontSize: 72, lineHeight: 1 }}>404</p>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Sahifa topilmadi.</h1>
        <p className="text-2 fs-14" style={{ marginTop: 10, lineHeight: 1.7 }}>
          <code className="kbd" style={{ fontSize: 12 }}>{location.pathname}</code> manzili bo‘yicha sahifa mavjud emas
          yoki ko‘chirilgan. Balki siz izlagan narsa quyidagilardandir?
        </p>
        <div className="row wrap" style={{ justifyContent: 'center', gap: 10, marginTop: 26 }}>
          <Button variant="primary" size="lg" onClick={() => navigate(user ? '/dashboard' : '/')}>
            <Home style={{ width: 16, height: 16 }} />{user ? 'Dashboardga qaytish' : 'Bosh sahifaga qaytish'}
          </Button>
          <Button size="lg" onClick={() => navigate(-1)}>
            <ArrowLeft style={{ width: 16, height: 16 }} />Orqaga
          </Button>
        </div>
        <div className="chip-row" style={{ justifyContent: 'center', marginTop: 28 }}>
          {[['/ai-cfo', 'AI CFO'], ['/sales', 'Savdo'], ['/warehouse', 'Ombor'], ['/finance', 'Moliya'], ['/reports', 'Hisobotlar']].map(([to, label]) => (
            <Link key={to} to={to} className="chip">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}
