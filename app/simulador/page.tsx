'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Receita, Despesa, Divida } from '@/lib/supabase'
import { calcFinancas, fmt } from '@/lib/finance'
import { Card, Alert, Btn, FormRow, FormGroup } from '@/components/ui'
import { LoadingScreen, ErrorScreen } from '@/components/States'

type SimResult = { label: string; antes: number; depois: number; descricao: string; positivo: boolean } | null

export default function Simulador() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [dividas, setDividas] = useState<Divida[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [consulVal, setConsulVal] = useState('500')
  const [dividaId, setDividaId] = useState('')
  const [corteVal, setCorteVal] = useState('300')
  const [r1, setR1] = useState<SimResult>(null)
  const [r2, setR2] = useState<SimResult>(null)
  const [r3, setR3] = useState<SimResult>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const sb = getSupabase()
      const [r, d, dv] = await Promise.all([sb.from('receitas').select('*'), sb.from('despesas').select('*'), sb.from('dividas').select('*').order('prioridade')])
      setReceitas(r.data || []); setDespesas(d.data || [])
      setDividas(dv.data || [])
      if (dv.data && dv.data.length > 0) setDividaId(dv.data[0].id)
    } catch (e: any) { setError(e?.message || 'Erro ao carregar') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} onRetry={load} />

  const fin = calcFinancas(receitas, despesas, dividas)

  function Resultado({ result }: { result: SimResult }) {
    if (!result) return null
    const delta = result.depois - result.antes
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: result.positivo ? 'var(--green-text)' : 'var(--red-text)' }}>{result.label}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><div style={{ fontSize: 10, color: 'var(--text2)' }}>Antes</div><div style={{ fontSize: 17, fontWeight: 700, color: result.antes >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>{fmt(result.antes)}</div></div>
          <div><div style={{ fontSize: 10, color: 'var(--text2)' }}>Depois</div><div style={{ fontSize: 17, fontWeight: 700, color: result.depois >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>{fmt(result.depois)}</div></div>
        </div>
        <Alert variant={result.positivo ? 'green' : 'red'}><span>{result.positivo ? '✓' : '⚠'}</span><span>{result.descricao}</span></Alert>
      </div>
    )
  }

  return (
    <main style={{ padding: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Simulador</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Simule cenários antes de decidir.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 20 }}>
        {[{ l: 'Saldo', v: fin.saldoAtual, c: fin.saldoAtual >= 0 ? 'var(--blue-text)' : 'var(--red-text)' }, { l: 'Comprometido', v: fin.comprometido, c: 'var(--amber-text)' }, { l: 'Livre', v: fin.livre, c: fin.livre >= 0 ? 'var(--green-text)' : 'var(--red-text)' }, { l: 'A Receber', v: fin.previsto, c: 'var(--blue-text)' }].map(({ l, v, c }) => (
          <div key={l} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c }}>{fmt(v)}</div>
          </div>
        ))}
      </div>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--blue-text)' }}>+ Nova Consultoria</div>
        <FormRow>
          <FormGroup label="Valor (R$)"><input type="number" value={consulVal} onChange={e => setConsulVal(e.target.value)} inputMode="decimal" /></FormGroup>
        </FormRow>
        <Btn variant="primary" onClick={() => { const v = parseFloat(consulVal) || 0; setR1({ label: '+ Consultoria de ' + fmt(v), antes: fin.livre, depois: fin.livre + v, descricao: `Fechar essa consultoria adiciona ${fmt(v)} ao seu saldo livre.`, positivo: true }) }}>Simular</Btn>
        <Resultado result={r1} />
      </Card>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--red-text)' }}>Quitar Dívida</div>
        <FormRow>
          <FormGroup label="Dívida">
            <select value={dividaId} onChange={e => setDividaId(e.target.value)}>
              {dividas.filter(d => d.pago < d.valor_total).map(d => <option key={d.id} value={d.id}>{d.nome} — {fmt(d.valor_total - d.pago)}</option>)}
            </select>
          </FormGroup>
        </FormRow>
        <Btn onClick={() => { const d = dividas.find(x => x.id === dividaId); if (!d) return; const rest = d.valor_total - d.pago; const depois = fin.livre - rest; setR2({ label: 'Quitar: ' + d.nome, antes: fin.livre, depois, descricao: depois < 0 ? 'Quitar agora deixa o caixa negativo. Aguarde mais entradas.' : `Você tem condições de quitar. Sobrarão ${fmt(depois)}.`, positivo: depois >= 0 }) }}>Ver impacto</Btn>
        <Resultado result={r2} />
      </Card>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--amber-text)' }}>Cortar Gastos</div>
        <FormRow>
          <FormGroup label="Valor a cortar (R$)"><input type="number" value={corteVal} onChange={e => setCorteVal(e.target.value)} inputMode="decimal" /></FormGroup>
        </FormRow>
        <Btn onClick={() => { const v = parseFloat(corteVal) || 0; const depois = fin.livre + v; setR3({ label: 'Cortar ' + fmt(v) + ' em gastos', antes: fin.livre, depois, descricao: `Cortando ${fmt(v)}, seu saldo livre passa para ${fmt(depois)}.`, positivo: true }) }}>Ver impacto</Btn>
        <Resultado result={r3} />
      </Card>
    </main>
  )
}
