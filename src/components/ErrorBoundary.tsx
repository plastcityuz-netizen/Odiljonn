import React from 'react'

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('BALANS AI error boundary:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)', padding: 24, fontFamily: 'Inter, sans-serif',
        }}>
          <div className="glass glass-2" style={{ maxWidth: 480, padding: 40, textAlign: 'center', borderRadius: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, background: 'var(--danger-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: 'var(--danger)',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text)' }}>Xatolik yuz berdi</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 13.5, marginTop: 10, lineHeight: 1.7 }}>
              Kutilmagan xatolik sodi bo‘ldi. Sahifani yangilash odatda muammoni hal qiladi.
              Xatolik davom etsa, ma’lumotlaringiz saqlab qolinishi kafolatlangan.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
              <button
                className="btn btn-primary"
                onClick={() => { this.setState({ error: null }); window.location.reload() }}
              >
                Qayta urinish
              </button>
              <button className="btn btn-ghost" onClick={() => { this.setState({ error: null }) }}>
                Davom etish
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
