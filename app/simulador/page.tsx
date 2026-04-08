'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Receita, Despesa, Divida } from '@/lib/supabase'
import { calcFinancas, fmt } from '@/lib/finance'
import { Card, Alert, Btn, FormRow, FormGroup } from '@/components/ui'

type SimResult = { label: string; antes: number; depois: number; descricao: string; positivo: boolean } | null

export default function Simulador() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [dividas, setDividas] = useState<Divida[]>([])
  const [loading, setLoading] = useState(true)

  // Simulador 1 — nova consultoria
  const [consulVal, setConsulVal] = useState('500')
  const [consulDia, setConsulDia] = useState('15')
  const [resultConsul, setResultConsul] = useState<SimResult>(null)

  // Simulador 2 — quitar dívida
  const [dividaId, setDividaId] = useState('')
  const [resultDivida, setResultDivida] = useState<SimResult>(null)

  // Simulador 3 — cortar gasto
  const [corteVal, setCorteVal] = useState('300')
  const [resultCorte, setResultCorte] = useState<SimResult>(null)

  useEffect(() => {
    async function load() {
      const [{ data: r }, { data: d }, { data: dv }] = await Promise.all([
        getSupabase().from('receitas').select('*'),
        getSupabase().from('despesas').select('*'),
        getSupabase().from('dividas').select('*').order('prioridade'),
      ])
      setReceitas(r || [])
      setDespesas(d || [])
      setDividas(dv || [])
      if (dv && dv.length > 0) setDividaId(dv[0].id)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p style={{ color: 'var(--text2)', padding: 24 }}>Carregando...</p>

  const fin = calcFinancas(receitas, despesas, dividas)

  function simConsultoria() {
    const val = parseFloat(consulVal) || 0
    const novaLivre = fin.livre + val
    setResultConsul({
      label: `+ Consultoria de ${fmt(val)}`,
      antes: fin.livre,
      depois: novaLivre,
      descricao: `Fechar essa consultoria adiciona ${fmt(val)} ao seu caixa.`,
      positivo: true,
    })
  }

  function simDivida() {
    const div = dividas.find(d => d.id === dividaId)
    if (!div) return
    const restD = div.valor_total - div.pago
    const novaLivre = fin.livre - restD
    setResultDivida({
      label: `Quitar: ${div.nome}`,
      antes: fin.livre,
      depois: novaLivre,
      descricao: novaLivre < 0
        ? `Quitar agora deixa caixa negativo em ${fmt(Math.abs(novaLivre))}. Aguarde mais entradas.`
        : `Você tem condições de quitar esta dívida agora. Sobrarão ${fmt(novaLivre)}.`,
      positivo: novaLivre >= 0,
    })
  }

  function simCorte() {
    const val = parseFloat(corteVal) || 0
    const novaLivre = fin.livre + val
    setResultCorte({
      label: `Cortar ${fmt(val)} em gastos variáveis`,
      antes: fin.livre,
      depois: novaLivre,
      descricao: `Cortando ${fmt(val)} de gastos variáveis, seu saldo livre passa para ${fmt(novaLivre)}.`,
      positivo: novaLivre >= fin.livre,
    })
  }

  function ResultCard({ result }: { result: SimResult }) {
    if (!result) return null
    const delta = result.depois - result.antes
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: result.positivo ? 'var(--green-text)' : 'var(--red-text)' }}>
          {result.label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Saldo livre atual</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: result.antes >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>{fmt(result.antes)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Saldo livre após</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: result.depois >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>{fmt(result.depois)}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
          Variação: <span style={{ fontWeight: 600, color: delta >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>{delta >= 0 ? '+' : ''}{fmt(delta)}</span>
        </div>
        <Alert variant={result.positivo ? 'green' : 'red'}>
          <span>{result.positivo ? '✓' : '⚠'}</span>
          <span>{result.descricao}</span>
        </Alert>
      </div>
    )
  }

  return (
    <main style={{ padding: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Simulador de Cenários</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
        Visualize o impacto financeiro de decisões antes de tomar.
      </p>

      {/* Saldo atual de referência */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Saldo em Caixa',    val: fin.saldoAtual,  color: fin.saldoAtual >= 0 ? 'var(--blue-text)' : 'var(--red-text)' },
          { label: 'Comprometido',       val: fin.comprometido, color: 'var(--amber-text)' },
          { label: 'Livre p/ Gastar',    val: fin.livre,       color: fin.livre >= 0 ? 'var(--green-text)' : 'var(--red-text)' },
          { label: 'A Receber',          val: fin.previsto,    color: 'var(--blue-text)' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{fmt(val)}</div>
          </div>
        ))}
      </div>

      {/* Simulador 1 — nova consultoria */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--blue-text)' }}>
          Cenário 1 — Nova Consultoria
        </div>
        <FormRow>
          <FormGroup label="Valor da consultoria (R$)">
            <input type="number" value={consulVal} onChange={e => setConsulVal(e.target.value)} placeholder="500" />
          </FormGroup>
          <FormGroup label="Dia previsto de recebimento">
            <input type="number" value={consulDia} onChange={e => setConsulDia(e.target.value)} min="1" max="31" />
          </FormGroup>
        </FormRow>
        <Btn variant="primary" onClick={simConsultoria}>Simular impacto</Btn>
        <ResultCard result={resultConsul} />
      </Card>

      {/* Simulador 2 — quitar dívida */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--red-text)' }}>
          Cenário 2 — Quitar Dívida
        </div>
        <FormRow>
          <FormGroup label="Selecione a dívida">
            <select value={dividaId} onChange={e => setDividaId(e.target.value)}>
              {dividas.filter(d => d.pago < d.valor_total).map(d => (
                <option key={d.id} value={d.id}>
                  {d.nome} — {fmt(d.valor_total - d.pago)}
                </option>
              ))}
            </select>
          </FormGroup>
        </FormRow>
        <Btn onClick={simDivida}>Ver impacto no caixa</Btn>
        <ResultCard result={resultDivida} />
      </Card>

      {/* Simulador 3 — cortar gasto variável */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--amber-text)' }}>
          Cenário 3 — Cortar Gastos Variáveis
        </div>
        <FormRow>
          <FormGroup label="Valor a cortar (R$)">
            <input type="number" value={corteVal} onChange={e => setCorteVal(e.target.value)} placeholder="300" />
          </FormGroup>
        </FormRow>
        <Btn onClick={simCorte}>Ver impacto</Btn>
        <ResultCard result={resultCorte} />
      </Card>
    </main>
  )
}
