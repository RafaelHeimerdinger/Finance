'use client'
export const dynamic = 'force-dynamic'

import { useRef, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useFinanceData } from '@/lib/hooks'
import { calcFinancas, calcProjection, fmt, fmtShort, TODAY_DAY, DAYS_IN_MONTH } from '@/lib/finance'
import { KpiCard, Card, Grid4, Grid2, Alert, Badge, Row } from '@/components/ui'
import { LoadingScreen, ErrorScreen } from '@/components/States'

declare const Chart: any

export default function Dashboard() {
  const { receitas, despesas, dividas, loading, error, reload } = useFinanceData()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<any>(null)

  useEffect(() => {
    if (loading || error || !chartRef.current || typeof Chart === 'undefined') return
    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null }
    const { saldoAtual } = calcFinancas(receitas, despesas, dividas)
    const proj = calcProjection(receitas, despesas, saldoAtual).filter(p => p.saldo !== null)
    const vals = proj.map(p => p.saldo as number)
    chartInst.current = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels: proj.map(p => String(p.day)), datasets: [{ data: vals, backgroundColor: vals.map(v => v < 0 ? 'rgba(239,68,68,.8)' : 'rgba(59,130,246,.8)'), borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => fmt(c.raw) } } }, scales: { x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#8b93b0', font: { size: 10 }, autoSkip: false, maxRotation: 0 } }, y: { grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#8b93b0', font: { size: 10 }, callback: (v: number) => fmtShort(v) } } } }
    })
  }, [loading, error, receitas, despesas, dividas])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} onRetry={reload} />

  const fin = calcFinancas(receitas, despesas, dividas)
  const proj = calcProjection(receitas, despesas, fin.saldoAtual)
  const minSaldo = Math.min(...proj.filter(p => p.saldo !== null).map(p => p.saldo as number))
  const proxVenc = despesas.filter(d => d.status !== 'pago' && d.dia >= TODAY_DAY).sort((a, b) => a.dia - b.dia).slice(0, 4)
  const proxEntradas = receitas.filter(r => r.status === 'previsto' && r.dia >= TODAY_DAY).sort((a, b) => a.dia - b.dia).slice(0, 4)
  const dividasAtraso = dividas.filter(d => d.atrasada && d.pago < d.valor_total)

  return (
    <main style={{ padding: 16 }}>
      {minSaldo < 0 && <Alert variant="red"><span>⚠</span><span>Risco de saldo negativo! Mínimo projetado: {fmt(minSaldo)}</span></Alert>}
      {dividasAtraso.length > 0 && <Alert variant="amber"><span>!</span><span>{dividasAtraso.length} dívida(s) em atraso — {fmt(dividasAtraso.reduce((a, d) => a + (d.valor_total - d.pago), 0))}</span></Alert>}

      <Grid4>
        <KpiCard label="Saldo em Caixa"  value={fmtShort(fin.saldoAtual)}  sub={'Hoje, dia ' + TODAY_DAY} color={fin.saldoAtual >= 0 ? 'blue' : 'red'} />
        <KpiCard label="Comprometido"    value={fmtShort(fin.comprometido)} sub="Contas a pagar"           color="amber" />
        <KpiCard label="Livre p/ Gastar" value={fmtShort(fin.livre)}        sub="Caixa − Comprometido"     color={fin.livre >= 0 ? 'green' : 'red'} />
        <KpiCard label="Ainda a Receber" value={fmtShort(fin.previsto)}     sub="Entradas previstas"       color="blue" />
      </Grid4>

      <Card style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Projeção de Caixa — {DAYS_IN_MONTH} dias</span>
          <Badge variant={minSaldo >= 0 ? 'green' : 'red'}>{minSaldo >= 0 ? 'Sem risco' : 'Risco'}</Badge>
        </div>
        <div style={{ width: '100%', height: 200, position: 'relative' }}>
          <canvas ref={chartRef} role="img" aria-label="Projeção diária do saldo" />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12, marginTop: 12 }}>
        <Card>
          <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Próximos Vencimentos</div>
          {proxVenc.map(d => (
            <Row key={d.id}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--red-text)', flexShrink: 0, lineHeight: 1.1, textAlign: 'center' }}>dia<br/>{d.dia}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{d.nome}</div><div style={{ fontSize: 11, color: 'var(--text2)' }}>{d.dia - TODAY_DAY === 0 ? 'HOJE' : 'em ' + (d.dia - TODAY_DAY) + 'd'}</div></div>
              <span style={{ color: 'var(--red-text)', fontWeight: 600, fontSize: 13 }}>{fmt(d.valor)}</span>
            </Row>
          ))}
          {proxVenc.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 12 }}>Nenhum vencimento próximo</div>}
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Próximas Entradas</div>
          {proxEntradas.map(r => (
            <Row key={r.id}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--green-text)', flexShrink: 0, lineHeight: 1.1, textAlign: 'center' }}>dia<br/>{r.dia}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{r.nome}</div><div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.tipo}</div></div>
              <span style={{ color: 'var(--green-text)', fontWeight: 600, fontSize: 13 }}>{fmt(r.valor)}</span>
            </Row>
          ))}
          {proxEntradas.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 12 }}>Nenhuma entrada prevista</div>}
        </Card>
      </div>

      {dividasAtraso.length > 0 && (
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Dívidas em Atraso</div>
          {dividasAtraso.map(d => (
            <Row key={d.id}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{d.nome}</div><div style={{ fontSize: 11, color: 'var(--text2)' }}>{d.credor}</div></div>
              <span style={{ color: 'var(--red-text)', fontWeight: 600 }}>{fmt(d.valor_total - d.pago)}</span>
            </Row>
          ))}
        </Card>
      )}
    </main>
  )
}
