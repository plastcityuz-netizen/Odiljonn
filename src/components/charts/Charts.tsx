import React, { useMemo, useRef, useState } from 'react'

export interface SeriesPoint { label: string; values: number[] }

interface AreaChartProps {
  data: SeriesPoint[]
  colors?: string[]
  names?: string[]
  height?: number
  format?: (v: number) => string
  showGrid?: boolean
}

export function AreaChart({ data, colors = ['#8b5cf6', '#e879f9'], names = [], height = 220, format = (v) => String(Math.round(v)), showGrid = true }: AreaChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const W = 760
  const H = height
  const padL = 46
  const padR = 14
  const padT = 18
  const padB = 30
  const seriesCount = data[0]?.values.length ?? 1

  const { max, min } = useMemo(() => {
    const all = data.flatMap((d) => d.values)
    const mx = Math.max(...all, 1)
    const mn = Math.min(...all, 0)
    const headroom = (mx - mn) * 0.12
    return { max: mx + headroom, min: Math.max(0, mn - headroom) }
  }, [data])

  const x = (i: number) => padL + (i / Math.max(1, data.length - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB)

  const gridLines = 4

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} role="img" aria-label="Diagramma">
        <defs>
          {colors.slice(0, seriesCount).map((c, i) => (
            <linearGradient key={i} id={`ag-${i}-${c.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="0.32" />
              <stop offset="100%" stopColor={c} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>

        {showGrid && Array.from({ length: gridLines + 1 }, (_, i) => {
          const gy = padT + (i / gridLines) * (H - padT - padB)
          const val = max - (i / gridLines) * (max - min)
          return (
            <g key={i}>
              <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="var(--border)" strokeDasharray="3 5" />
              <text x={padL - 8} y={gy + 4} textAnchor="end" fontSize="10.5" fill="var(--text-3)" fontFamily="Inter">{format(val)}</text>
            </g>
          )
        })}

        {colors.slice(0, seriesCount).map((c, si) => {
          const pts = data.map((d, i) => `${x(i)},${y(d.values[si] ?? 0)}`).join(' ')
          const area = `M ${padL},${y(min)} L ${pts.split(' ').join(' L ')} L ${x(data.length - 1)},${y(min)} Z`
          return (
            <g key={si}>
              <path d={area} fill={`url(#ag-${si}-${c.replace('#', '')})`} />
              <polyline
                points={pts} fill="none" stroke={c} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${c}55)`, strokeDasharray: 2400, strokeDashoffset: 0, animation: 'drawLine 1.4s ease' }}
              />
            </g>
          )
        })}

        {hover !== null && (
          <g>
            <line x1={x(hover)} y1={padT} x2={x(hover)} y2={H - padB} stroke="var(--border-2)" />
            {data[hover].values.map((v, si) => (
              <circle key={si} cx={x(hover)} cy={y(v)} r="4.5" fill={colors[si]} stroke="var(--bg)" strokeWidth="2" />
            ))}
          </g>
        )}

        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={x(i) - (W - padL - padR) / (data.length * 2)} y={padT} width={(W - padL - padR) / data.length}
              height={H - padT - padB} fill="transparent" style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            />
            {data.length <= 14 && <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--text-3)" fontFamily="Inter">{d.label}</text>}
          </g>
        ))}
      </svg>

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{ left: `${((x(hover)) / W) * 100}%`, top: `${(y(Math.max(...data[hover].values)) / H) * 100}%` }}
        >
          <div className="fw-6 mb-1" style={{ fontSize: 12 }}>{data[hover].label}</div>
          {data[hover].values.map((v, si) => (
            <div key={si} className="row" style={{ justifyContent: 'space-between', gap: 14 }}>
              <span className="row" style={{ gap: 6, fontSize: 12 }}>
                <span className="cl-dot" style={{ width: 8, height: 8, borderRadius: 3, background: colors[si] }} />
                {names[si] ?? `Seriya ${si + 1}`}
              </span>
              <span className="mono fw-6" style={{ fontSize: 12 }}>{format(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface BarChartProps {
  data: SeriesPoint[]
  colors?: string[]
  names?: string[]
  height?: number
  format?: (v: number) => string
  horizontal?: boolean
}

export function BarChart({ data, colors = ['#8b5cf6', '#e879f9'], names = [], height = 220, format = (v) => String(Math.round(v)), horizontal = false }: BarChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const seriesCount = data[0]?.values.length ?? 1

  if (horizontal) {
    const max = Math.max(...data.flatMap((d) => d.values), 1)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => (
          <div key={i} className="row" style={{ gap: 12 }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="fs-12 text-2" style={{ width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{d.label}</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {d.values.map((v, si) => (
                <div key={si} style={{ position: 'relative', height: 12, borderRadius: 6, background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', inset: 0, width: `${(v / max) * 100}%`, borderRadius: 6,
                    background: `linear-gradient(90deg, ${colors[si]}, ${colors[si]}bb)`,
                    transition: 'width .9s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
              ))}
            </div>
            <span className="fs-12 mono fw-6" style={{ width: 86, flexShrink: 0 }}>{format(d.values.reduce((a, b) => Math.max(a, b), 0))}</span>
          </div>
        ))}
        {names.length > 1 && (
          <div className="chart-legend" style={{ marginTop: 4, paddingLeft: 142 }}>
            {names.map((n, i) => <span key={i} className="cl-item"><span className="cl-dot" style={{ background: colors[i] }} />{n}</span>)}
          </div>
        )}
      </div>
    )
  }

  const W = 760
  const H = height
  const padL = 46, padR = 14, padT = 18, padB = 30
  const max = Math.max(...data.flatMap((d) => d.values), 1) * 1.12
  const groupW = (W - padL - padR) / data.length
  const barW = Math.min(16, (groupW - 10) / seriesCount)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} role="img" aria-label="Diagramma">
        {Array.from({ length: 5 }, (_, i) => {
          const gy = padT + (i / 4) * (H - padT - padB)
          return (
            <g key={i}>
              <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="var(--border)" strokeDasharray="3 5" />
              <text x={padL - 8} y={gy + 4} textAnchor="end" fontSize="10.5" fill="var(--text-3)" fontFamily="Inter">{format(max - (i / 4) * max)}</text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const gx = padL + i * groupW
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }}>
              <rect x={gx} y={padT} width={groupW} height={H - padT - padB} fill={hover === i ? 'var(--surface)' : 'transparent'} rx="8" />
              {d.values.map((v, si) => {
                const h = Math.max(2, (v / max) * (H - padT - padB))
                const bx = gx + groupW / 2 - (seriesCount * barW + (seriesCount - 1) * 4) / 2 + si * (barW + 4)
                return (
                  <rect key={si} x={bx} y={H - padB - h} width={barW} height={h} rx={Math.min(6, barW / 2)} fill={colors[si]} opacity={hover === null || hover === i ? 0.92 : 0.45}
                    style={{ filter: `drop-shadow(0 0 5px ${colors[si]}44)` }} />
                )
              })}
              <text x={gx + groupW / 2} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--text-3)" fontFamily="Inter">{d.label}</text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="chart-tooltip" style={{ left: `${((padL + hover * groupW + groupW / 2) / W) * 100}%`, top: 8 }}>
          <div className="fw-6 mb-1" style={{ fontSize: 12 }}>{data[hover].label}</div>
          {data[hover].values.map((v, si) => (
            <div key={si} className="row" style={{ justifyContent: 'space-between', gap: 14 }}>
              <span className="row" style={{ gap: 6, fontSize: 12 }}><span className="cl-dot" style={{ width: 8, height: 8, borderRadius: 3, background: colors[si] }} />{names[si] ?? `Seriya ${si + 1}`}</span>
              <span className="mono fw-6" style={{ fontSize: 12 }}>{format(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DonutChart({ data, size = 190, thickness = 22, format = (v: number) => String(v), centerLabel, centerValue }: {
  data: { label: string; value: number; color: string }[]
  size?: number; thickness?: number; format?: (v: number) => string
  centerLabel?: string; centerValue?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let acc = 0

  return (
    <div className="row wrap" style={{ gap: 20, justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
          {data.map((d, i) => {
            const frac = d.value / total
            const dash = frac * c
            const offset = acc
            acc += dash
            return (
              <circle
                key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={d.color} strokeWidth={hover === i ? thickness + 4 : thickness}
                strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset}
                strokeLinecap="butt" opacity={hover === null || hover === i ? 1 : 0.4}
                style={{ transition: 'stroke-width .2s, opacity .2s', cursor: 'pointer' }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span className="fs-11 text-3 fw-6" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>{hover !== null ? data[hover].label : centerLabel}</span>
          <span className="font-display fw-7" style={{ fontSize: 20, marginTop: 2 }}>{hover !== null ? format(data[hover].value) : centerValue}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
        {data.map((d, i) => (
          <div key={i} className="row" style={{ justifyContent: 'space-between', gap: 12 }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="row fs-12 text-2" style={{ gap: 7 }}><span className="cl-dot" style={{ background: d.color }} />{d.label}</span>
            <span className="fs-12 mono fw-6">{format(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Sparkline({ values, color = '#8b5cf6', width = 96, height = 30 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / (max - min || 1)) * (height - 6)}`).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color}66)` }} />
    </svg>
  )
}

export function ProgressRing({ value, size = 130, thickness = 10, label }: {
  value: number; size?: number; thickness?: number; label?: string
}) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const [anim, setAnim] = React.useState(0)
  React.useEffect(() => {
    const t = setTimeout(() => setAnim(value), 80)
    return () => clearTimeout(t)
  }, [value])
  const color = value >= 75 ? 'var(--success)' : value >= 55 ? 'var(--accent-2)' : value >= 40 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="prg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={value >= 75 ? 'url(#prg)' : color}
          strokeWidth={thickness} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (anim / 100) * c}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)', filter: 'drop-shadow(0 0 8px rgba(139,92,246,.45))' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-display fw-7" style={{ fontSize: size * 0.24 }}>{Math.round(value)}</span>
        {label && <span className="fs-10 text-3 fw-6" style={{ textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</span>}
      </div>
    </div>
  )
}
