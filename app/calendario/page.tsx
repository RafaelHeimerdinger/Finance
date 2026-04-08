'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Receita, Despesa, Divida } from '@/lib/supabase'
import { calcFinancas, calcProjection, fmt, fmtShort, TODAY_DAY, DAYS_IN_MONTH } from '@/lib/finance'
import { LoadingScreen, ErrorScreen } from '@/components/States'

function getDayOfWeek(day: number) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), day).getDay()
}

export default function Calendario() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [dividas, setDividas] = useState<Divida[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const sb = getSupabase()
      const [r, d, dv] = await Promise.all([sb.from('receitas').select('*'), sb.from('despesas').select('*'), sb.from('dividas').select('*')])
      setReceitas(r.data || []); setDespesas(d.data || []); setDividas(dv.data || [])
    } catch (e: any) { setError(e?.message || 'Erro ao carregar') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} onRetry={load} />

  const fin = calcFinancas(receitas, despesas, dividas)
  const proj = calcProjection(receitas, despesas, fin.saldoAtual)
  const firstWeekday = getDayOfWeek(1)
  const mesNome = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <main style={{ padding: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, textTransform: 'capitalize' }}>Calendário — {mesNome}</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {[{ cor: 'var(--green)', label: 'Entrada' }, { cor: 'var(--red)', label: 'Saída' }, { cor: 'var(--blue)', label: 'Hoje' }].map(({ cor, label }) => (
          <span key={label} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: cor, display: 'inline-block' }} />{label}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
        {['D','S','T','Q','Q','S','S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', padding: 3 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {Array(firstWeekday).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map(day => {
          const entradas = receitas.filter(r => r.dia === day)
          const saidas = despesas.filter(d => d.dia === day)
          const p = proj[day - 1]
          const saldo = p?.saldo ?? null
          const isToday = day === TODAY_DAY
          const isRisco = saldo !== null && saldo < 0
          return (
            <div key={day} style={{ background: isToday ? 'var(--blue-bg)' : 'var(--bg3)', border: `1px solid ${isToday ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 7, padding: '5px 6px', minHeight: 72, opacity: day < TODAY_DAY ? 0.5 : 1, fontSize: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, color: isToday ? 'var(--blue-text)' : 'var(--text)' }}>{day}</div>
              {entradas.map(e => <div key={e.id} style={{ background: 'var(--green-bg)', color: 'var(--green-text)', padding: '1px 3px', borderRadius: 3, marginBottom: 1, fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>+{fmtShort(e.valor)}</div>)}
              {saidas.map(d => <div key={d.id} style={{ background: 'var(--red-bg)', color: 'var(--red-text)', padding: '1px 3px', borderRadius: 3, marginBottom: 1, fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>-{fmtShort(d.valor)}</div>)}
              {saldo !== null && <div style={{ fontSize: 8, marginTop: 2, color: isRisco ? 'var(--red-text)' : 'var(--text3)', fontWeight: isRisco ? 700 : 400 }}>{fmtShort(saldo)}</div>}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginTop: 16 }}>
        {[
          { label: 'Total Entradas', val: receitas.reduce((a, r) => a + r.valor, 0), color: 'var(--green-text)' },
          { label: 'Total Saídas', val: despesas.reduce((a, d) => a + d.valor, 0), color: 'var(--red-text)' },
          { label: 'Saldo Final', val: proj[DAYS_IN_MONTH - 1]?.saldo ?? 0, color: (proj[DAYS_IN_MONTH - 1]?.saldo ?? 0) >= 0 ? 'var(--blue-text)' : 'var(--red-text)' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color }}>{fmt(val)}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
