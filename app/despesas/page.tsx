'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Despesa } from '@/lib/supabase'
import { fmt, fmtShort, TODAY_DAY } from '@/lib/finance'
import { Card, KpiCard, Grid2, Badge, Row, Btn, Modal, FormRow, FormGroup, SectionTitle } from '@/components/ui'
import { LoadingScreen, ErrorScreen } from '@/components/States'

type Form = { nome: string; categoria: string; sub_tipo: string; valor: string; dia: string; essencial: string; status: string; recorrente: string; obs: string }
const empty: Form = { nome: '', categoria: '', sub_tipo: 'fixa', valor: '', dia: '', essencial: 'true', status: 'previsto', recorrente: 'false', obs: '' }

export default function Despesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Form>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true); setError(null)
    try {
      const { data, error: e } = await getSupabase().from('despesas').select('*').order('dia')
      if (e) throw e
      setDespesas(data || [])
    } catch (e: any) { setError(e?.message || 'Erro ao carregar') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const fixas = despesas.filter(d => d.sub_tipo === 'fixa')
  const variaveis = despesas.filter(d => d.sub_tipo === 'variavel')
  const totalF = fixas.reduce((a, d) => a + d.valor, 0)
  const totalV = variaveis.reduce((a, d) => a + d.valor, 0)
  const pagoF = fixas.filter(d => d.status === 'pago').reduce((a, d) => a + d.valor, 0)
  const pagoV = variaveis.filter(d => d.status === 'pago').reduce((a, d) => a + d.valor, 0)

  async function toggleStatus(id: string, s: string) { await getSupabase().from('despesas').update({ status: s }).eq('id', id); load() }
  async function deletar(id: string) { if (!confirm('Remover?')) return; await getSupabase().from('despesas').delete().eq('id', id); load() }
  async function salvar() {
    if (!form.nome || !form.valor || !form.dia) return alert('Preencha nome, valor e dia.')
    setSaving(true)
    try { await getSupabase().from('despesas').insert({ nome: form.nome, categoria: form.categoria, sub_tipo: form.sub_tipo, valor: parseFloat(form.valor), dia: parseInt(form.dia), essencial: form.essencial === 'true', status: form.status, recorrente: form.recorrente === 'true', obs: form.obs }) }
    finally { setSaving(false); setModal(false); setForm(empty); load() }
  }
  function f(k: keyof Form) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value })) }
  function badge(d: Despesa) {
    if (d.status === 'pago') return <Badge variant="green">pago</Badge>
    if (d.dia < TODAY_DAY) return <Badge variant="red">atrasado</Badge>
    return <Badge variant="amber">previsto</Badge>
  }

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} onRetry={load} />

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Despesas</h2>
        <Btn variant="primary" onClick={() => setModal(true)}>+ Adicionar</Btn>
      </div>
      <Grid2>
        <KpiCard label="Contas Fixas" value={fmtShort(totalF)} sub={`Pago: ${fmt(pagoF)} · Pendente: ${fmt(totalF - pagoF)}`} color="amber" />
        <KpiCard label="Gastos Variáveis" value={fmtShort(totalV)} sub={`Pago: ${fmt(pagoV)} · Pendente: ${fmt(totalV - pagoV)}`} color="red" />
      </Grid2>
      <SectionTitle>Contas Fixas</SectionTitle>
      <Card>
        {fixas.sort((a, b) => a.dia - b.dia).map(d => (
          <Row key={d.id}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: d.status === 'pago' ? 'var(--green-bg)' : d.dia <= TODAY_DAY ? 'var(--red-bg)' : 'var(--amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: d.status === 'pago' ? 'var(--green-text)' : d.dia <= TODAY_DAY ? 'var(--red-text)' : 'var(--amber-text)', flexShrink: 0, lineHeight: 1.1, textAlign: 'center' }}>d{d.dia}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{d.nome}{!d.essencial && <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 4 }}>(não essencial)</span>}</div><div style={{ fontSize: 11, color: 'var(--text2)' }}>{d.categoria}{d.recorrente ? ' · mensal' : ''}</div></div>
            {badge(d)}
            <span style={{ color: 'var(--red-text)', fontWeight: 600, fontSize: 13, minWidth: 72, textAlign: 'right' }}>{fmt(d.valor)}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {d.status !== 'pago' ? <Btn size="sm" onClick={() => toggleStatus(d.id, 'pago')}>✓ Pago</Btn> : <Btn size="sm" onClick={() => toggleStatus(d.id, 'previsto')}>↩</Btn>}
              <Btn size="sm" variant="danger" onClick={() => deletar(d.id)}>✕</Btn>
            </div>
          </Row>
        ))}
      </Card>
      <SectionTitle>Gastos Variáveis</SectionTitle>
      <Card>
        {variaveis.sort((a, b) => a.dia - b.dia).map(d => (
          <Row key={d.id}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text2)', flexShrink: 0, lineHeight: 1.1, textAlign: 'center' }}>d{d.dia}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{d.nome}{!d.essencial && <span style={{ fontSize: 10, color: 'var(--amber-text)', marginLeft: 4 }}>(cortável)</span>}</div><div style={{ fontSize: 11, color: 'var(--text2)' }}>{d.categoria}{d.obs ? ' · ' + d.obs : ''}</div></div>
            {badge(d)}
            <span style={{ color: 'var(--red-text)', fontWeight: 600, fontSize: 13, minWidth: 72, textAlign: 'right' }}>{fmt(d.valor)}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {d.status !== 'pago' ? <Btn size="sm" onClick={() => toggleStatus(d.id, 'pago')}>✓</Btn> : <Btn size="sm" onClick={() => toggleStatus(d.id, 'previsto')}>↩</Btn>}
              <Btn size="sm" variant="danger" onClick={() => deletar(d.id)}>✕</Btn>
            </div>
          </Row>
        ))}
      </Card>
      {modal && (
        <Modal title="Nova Despesa" onClose={() => setModal(false)}>
          <FormRow>
            <FormGroup label="Nome"><input value={form.nome} onChange={f('nome')} placeholder="Nome" /></FormGroup>
            <FormGroup label="Categoria"><input value={form.categoria} onChange={f('categoria')} placeholder="ex: alimentação" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Subtipo"><select value={form.sub_tipo} onChange={f('sub_tipo')}><option value="fixa">Fixa</option><option value="variavel">Variável</option></select></FormGroup>
            <FormGroup label="Valor (R$)"><input type="number" value={form.valor} onChange={f('valor')} placeholder="0.00" inputMode="decimal" /></FormGroup>
            <FormGroup label="Dia"><input type="number" value={form.dia} onChange={f('dia')} placeholder="Dia" min="1" max="31" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Essencial"><select value={form.essencial} onChange={f('essencial')}><option value="true">Sim</option><option value="false">Não</option></select></FormGroup>
            <FormGroup label="Status"><select value={form.status} onChange={f('status')}><option value="previsto">Previsto</option><option value="pago">Pago</option></select></FormGroup>
            <FormGroup label="Recorrente"><select value={form.recorrente} onChange={f('recorrente')}><option value="false">Não</option><option value="true">Sim</option></select></FormGroup>
          </FormRow>
          <FormGroup label="Observações"><input value={form.obs} onChange={f('obs')} /></FormGroup>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Btn variant="primary" onClick={salvar} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Btn>
            <Btn onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </main>
  )
}
