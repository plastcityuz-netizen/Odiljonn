import React, { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { Button, EmptyState, Input } from './primitives'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  className?: string
  hideOnMobile?: boolean
  mobileRender?: (row: T) => React.ReactNode
  align?: 'left' | 'right'
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  searchValue?: string
  onSearch?: (v: string) => void
  searchPlaceholder?: string
  placeholder?: { title: string; text?: string; action?: React.ReactNode; icon?: React.ReactNode }
  toolbar?: React.ReactNode
  pageSize?: number
  emptyAction?: React.ReactNode
  onRowClick?: (row: T) => void
  mobileTitle?: (row: T) => React.ReactNode
  mobileSubtitle?: (row: T) => React.ReactNode
}

export function DataTable<T>({
  columns, rows, rowKey, searchValue, onSearch, searchPlaceholder = 'Qidirish...',
  placeholder, toolbar, pageSize = 8, onRowClick, mobileTitle, mobileSubtitle,
}: Props<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a)
      const vb = col.sortValue!(b)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sort.dir
      return String(va).localeCompare(String(vb), 'uz') * sort.dir
    })
  }, [rows, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const paged = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const toggleSort = (key: string) => {
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))
    setPage(0)
  }

  return (
    <div>
      {(onSearch || toolbar) && (
        <div className="row wrap mb-2" style={{ justifyContent: 'space-between' }}>
          {onSearch && (
            <div className="searchbar" style={{ minWidth: 240, flex: '0 1 280px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input value={searchValue ?? ''} onChange={(e) => { onSearch(e.target.value); setPage(0) }} placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
            </div>
          )}
          <div className="row wrap">{toolbar}</div>
        </div>
      )}

      {rows.length === 0 && placeholder ? (
        <EmptyState icon={placeholder.icon ?? <Inbox />} title={placeholder.title} text={placeholder.text} action={placeholder.action} />
      ) : (
        <div className="table-wrap has-cards glass" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`${c.sortValue ? 'sortable' : ''} ${c.align === 'right' ? 'right' : ''}`}
                    onClick={() => c.sortValue && toggleSort(c.key)}
                    style={c.hideOnMobile ? undefined : undefined}
                  >
                    <span className="row" style={{ justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start', gap: 4 }}>
                      {c.header}
                      {sort?.key === c.key && (sort.dir === 1 ? <ArrowUp style={{ width: 11, height: 11 }} /> : <ArrowDown style={{ width: 11, height: 11 }} />)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.align === 'right' ? 'right' : ''}>{c.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile card layout */}
          <div className="table-cards">
            {paged.map((row) => (
              <div key={rowKey(row)} className="table-card-item" onClick={onRowClick ? () => onRowClick(row) : undefined}>
                <div className="table-card-row">
                  <span className="fw-6" style={{ fontSize: 13.5 }}>{mobileTitle ? mobileTitle(row) : (columns[0].mobileRender ? columns[0].mobileRender(row) : columns[0].render(row))}</span>
                </div>
                {mobileSubtitle && <div className="fs-12 text-2">{mobileSubtitle(row)}</div>}
                {columns.slice(1).map((c) => (
                  <div key={c.key} className="table-card-row">
                    <span className="table-card-label">{c.header}</span>
                    <span>{c.mobileRender ? c.mobileRender(row) : c.render(row)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {sorted.length > pageSize && (
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
          <span className="fs-12 text-3">
            {safePage * pageSize + 1}–{Math.min(sorted.length, (safePage + 1) * pageSize)} / {sorted.length} yozuv
          </span>
          <div className="row">
            <Button size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} aria-label="Oldingi"><ChevronLeft /></Button>
            <span className="fs-12 text-2" style={{ padding: '0 6px' }}>{safePage + 1} / {pages}</span>
            <Button size="sm" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={safePage >= pages - 1} aria-label="Keyingi"><ChevronRight /></Button>
          </div>
        </div>
      )}
    </div>
  )
}

// filter chips helper
export function FilterChips({ options, value, onChange }: {
  options: { key: string; label: string }[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o.key} className={`chip ${value === o.key ? 'active' : ''}`} onClick={() => onChange(o.key)}>{o.label}</button>
      ))}
    </div>
  )
}

export { Input }
