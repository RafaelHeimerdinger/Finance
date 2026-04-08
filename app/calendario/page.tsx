'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Receita, Despesa } from '@/lib/supabase'
import { calcFinancas, calcProjection, fmt, fmtShort, TODAY_DAY, DAYS_IN_MONTH } from '@/lib/finance'
import type { Divida } from '@/lib/supabase'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getDayOfWeek(day: number) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), day).getDay()
}

export default function Calendario() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [dividas, setDividas] = useState<Divida[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: r }, { data: d }, { data: dv }] = await Promise.all([
        getSupabase().from('receitas').select('*'),
        getSupabase().from('despesas').select('*'),
        getSupabase().from('dividas').select('*'),
      ])
      setReceitas(r || [])
      setDespesas(d || [])
      setDividas(dv || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p style={{ color: 'var(--text2)', padding: 24 }}>Carregando...</p>

  const fin = calcFinancas(receitas, despesas, dividas)
  const proj = calcProjection(receitas, despesas, fin.saldoAtual)

  const firstWeekday = getDayOfWeek(1)
  const dias = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1)

  const now = new Date()
  const mesNome = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <main style={{ padding: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, textTransform: 'capitalize' }}>
        Calendário — {mesNome}
      </h2>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { cor: 'var(--green)', label: 'Entrada' },
          { cor: 'var(--red)', label: 'Saída' },
          { cor: 'var(--blue)', label: 'Hoje' },
          { cor: 'var(--red-text)', label: 'Saldo negativo' },
        ].map(({ cor, label }) => (
          <span key={label} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: cor, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {/* Cabeçalho da semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', padding: 4 }}>{d}</div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {/* Dias vazios antes do dia 1 */}
        {Array(firstWeekday).fill(null).map((_, i) => <div key={`empty-${i}`} />)}

        {dias.map(day => {
          const entradas = receitas.filter(r => r.dia === day)
          const saidas = despesas.filter(d => d.dia === day)
          const p = proj[day - 1]
          const saldo = p?.saldo ?? null
          const isToday = day === TODAY_DAY
          const isPast = day < TODAY_DAY
          const isRisco = saldo !== null && saldo < 0

          return (
            <div
              key={day}
              style={{
                background: isToday ? 'var(--blue-bg)' : 'var(--bg3)',
                border: `1px solid ${isToday ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '6px 8px',
                minHeight: 80,
                opacity: isPast ? 0.5 : 1,
                fontSize: 11,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: isToday ? 'var(--blue-text)' : 'var(--text)' }}>{day}</div>

              {entradas.map(e => (
                <div key={e.id} style={{ background: 'var(--green-bg)', color: 'var(--green-text)', padding: '1px 4px', borderRadius: 4, marginBottom: 2, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  +{fmtShort(e.valor)}
                </div>
              ))}
              {saidas.map(d => (
                <div key={d.id} style={{ background: 'var(--red-bg)', color: 'var(--red-text)', padding: '1px 4px', borderRadius: 4, marginBottom: 2, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  -{fmtShort(d.valor)}
                </div>
              ))}

              {saldo !== null && (
                <div style={{ fontSize: 9, marginTop: 2, color: isRisco ? 'var(--red-text)' : 'var(--text3)', fontWeight: isRisco ? 700 : 400 }}>
                  {fmtShort(saldo)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resumo do mês */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 16 }}>
        {[
          { label: 'Total Entradas', val: receitas.reduce((a, r) => a + r.valor, 0), color: 'var(--green-text)' },
          { label: 'Total Saídas', val: despesas.reduce((a, d) => a + d.valor, 0), color: 'var(--red-text)' },
          { label: 'Saldo Projetado Final', val: proj[DAYS_IN_MONTH - 1]?.saldo ?? 0, color: (proj[DAYS_IN_MONTH - 1]?.saldo ?? 0) >= 0 ? 'var(--blue-text)' : 'var(--red-text)' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{fmt(val)}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
