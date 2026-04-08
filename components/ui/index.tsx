'use client'
import React from 'react'

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'gray'
const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  green: { background: 'var(--green-bg)', color: 'var(--green-text)' },
  red:   { background: 'var(--red-bg)',   color: 'var(--red-text)' },
  amber: { background: 'var(--amber-bg)', color: 'var(--amber-text)' },
  blue:  { background: 'var(--blue-bg)',  color: 'var(--blue-text)' },
  gray:  { background: 'var(--bg4)',      color: 'var(--text2)' },
}
export function Badge({ variant = 'gray', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return (
    <span style={{ ...badgeStyles[variant], display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, ...style }}>
      {children}
    </div>
  )
}

export function CardSm({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, ...style }}>
      {children}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
type KpiColor = 'green' | 'red' | 'amber' | 'blue' | 'default'
const kpiColorMap: Record<KpiColor, string> = {
  green: 'var(--green-text)',
  red:   'var(--red-text)',
  amber: 'var(--amber-text)',
  blue:  'var(--blue-text)',
  default: 'var(--text)',
}
export function KpiCard({ label, value, sub, color = 'default' }: { label: string; value: string; sub?: string; color?: KpiColor }) {
  return (
    <CardSm>
      <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.5px', color: kpiColorMap[color] }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 4 }}>{sub}</div>}
    </CardSm>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'default' | 'primary' | 'danger'
export function Btn({
  children, onClick, variant = 'default', size = 'md', disabled = false, type = 'button'
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: BtnVariant
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const base: React.CSSProperties = {
    padding: size === 'sm' ? '4px 10px' : '8px 16px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg3)',
    color: 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: size === 'sm' ? 12 : 13,
    fontWeight: 500,
    opacity: disabled ? .5 : 1,
    transition: 'all .15s',
    whiteSpace: 'nowrap' as const,
  }
  if (variant === 'primary') { base.background = 'var(--blue)'; base.borderColor = 'var(--blue)'; base.color = '#fff' }
  if (variant === 'danger')  { base.background = 'var(--red-bg)'; base.borderColor = 'var(--red)'; base.color = 'var(--red-text)' }
  return <button type={type} style={base} onClick={onClick} disabled={disabled}>{children}</button>
}

// ─── Row ──────────────────────────────────────────────────────────────────────
export function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export function Alert({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  return (
    <div style={{ ...badgeStyles[variant], padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 8, border: `1px solid var(--${variant})` }}>
      {children}
    </div>
  )
}

// ─── Section Title ────────────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '20px 0 10px' }}>
      {children}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title}
          <Btn size="sm" onClick={onClose}>✕</Btn>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Form helpers ─────────────────────────────────────────────────────────────
export function FormRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>{children}</div>
}

export function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
      <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ pct, color = 'var(--green)' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 3, transition: 'width .3s' }} />
    </div>
  )
}

// ─── Grid helpers ─────────────────────────────────────────────────────────────
export function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>{children}</div>
}

export function Grid3({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>{children}</div>
}

export function Grid4({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>{children}</div>
}
