'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Receita } from '@/lib/supabase'
import { fmt, fmtShort } from '@/lib/finance'
import { Card, KpiCard, Grid2, Badge, Row, Btn, Modal, FormRow, FormGroup, SectionTitle, Alert } from '@/components/ui'

type Form = { nome: string; tipo: string; sub_tipo: string; valor: string; dia: string; status: string; recorrente: string; obs: string }
const empty: Form = { nome: '', tipo: 'personal', sub_tipo: 'fixa', valor: '', dia: '', status: 'previsto', recorrente: 'true', obs: '' }

export default function Receitas() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Form>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await getSupabase().from('receitas').select('*').order('dia')
    setReceitas(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const fixas = receitas.filter(r => r.sub_tipo === 'fixa')
  const variaveis = receitas.filter(r => r.sub_tipo === 'variavel')
  const totalF = fixas.reduce((a, r) => a + r.valor, 0)
  const totalV = variaveis.reduce((a, r) => a + r.valor, 0)
  const recebF = fixas.filter(r => r.status === 'recebido').reduce((a, r) => a + r.valor, 0)
  const recebV = variaveis.filter(r => r.status === 'recebido').reduce((a, r) => a + r.valor, 0)

  async function toggleStatus(id: string, novoStatus: string) {
    await getSupabase().from('receitas').update({ status: novoStatus }).eq('id', id)
    load()
  }

  async function deletar(id: string) {
    if (!confirm('Remover esta receita?')) return
    await getSupabase().from('receitas').delete().eq('id', id)
    load()
  }

  async function salvar() {
    if (!form.nome || !form.valor || !form.dia) return alert('Preencha nome, valor e dia.')
    setSaving(true)
    await getSupabase().from('receitas').insert({
      nome: form.nome, tipo: form.tipo, sub_tipo: form.sub_tipo,
      valor: parseFloat(form.valor), dia: parseInt(form.dia),
      status: form.status, recorrente: form.recorrente === 'true', obs: form.obs,
    })
    setSaving(false)
    setModal(false)
    setForm(empty)
    load()
  }

  function f(k: keyof Form) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(prev => ({ ...prev, [k]: e.target.value })) }

  function statusBadge(r: Receita) {
    if (r.status === 'recebido') return <Badge variant="green">recebido</Badge>
    if (r.status === 'atrasado') return <Badge variant="red">atrasado</Badge>
    return <Badge variant="gray">previsto</Badge>
  }

  if (loading) return <p style={{ color: 'var(--text2)', padding: 24 }}>Carregando...</p>

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Receitas</h2>
        <Btn variant="primary" onClick={() => setModal(true)}>+ Adicionar</Btn>
      </div>

      <Grid2>
        <KpiCard label="Renda Fixa — Total" value={fmtShort(totalF)} sub={`Recebido: ${fmt(recebF)} · Previsto: ${fmt(totalF - recebF)}`} color="green" />
        <KpiCard label="Renda Variável — Total" value={fmtShort(totalV)} sub={`Recebido: ${fmt(recebV)} · Previsto: ${fmt(totalV - recebV)}`} color="blue" />
      </Grid2>

      <SectionTitle>Renda Fixa</SectionTitle>
      <Card>
        {fixas.sort((a, b) => a.dia - b.dia).map(r => (
          <Row key={r.id}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--green-text)', flexShrink: 0, lineHeight: 1.1, textAlign: 'center' }}>d{r.dia}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.nome}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.tipo}{r.recorrente ? ' · mensal' : ''}</div>
            </div>
            {statusBadge(r)}
            <span style={{ color: 'var(--green-text)', fontWeight: 600, fontSize: 13, minWidth: 80, textAlign: 'right' }}>{fmt(r.valor)}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {r.status !== 'recebido'
                ? <Btn size="sm" onClick={() => toggleStatus(r.id, 'recebido')}>✓</Btn>
                : <Btn size="sm" onClick={() => toggleStatus(r.id, 'previsto')}>↩</Btn>}
              <Btn size="sm" variant="danger" onClick={() => deletar(r.id)}>✕</Btn>
            </div>
          </Row>
        ))}
      </Card>

      <SectionTitle>Renda Variável (Consultorias)</SectionTitle>
      <Card>
        {variaveis.length === 0
          ? <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 20 }}>Nenhuma renda variável lançada</div>
          : variaveis.sort((a, b) => a.dia - b.dia).map(r => (
            <Row key={r.id}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--blue-text)', flexShrink: 0, lineHeight: 1.1, textAlign: 'center' }}>d{r.dia}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.tipo}{r.obs ? ' · ' + r.obs : ''}</div>
              </div>
              {statusBadge(r)}
              <span style={{ color: 'var(--blue-text)', fontWeight: 600, fontSize: 13, minWidth: 80, textAlign: 'right' }}>{fmt(r.valor)}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {r.status !== 'recebido'
                  ? <Btn size="sm" onClick={() => toggleStatus(r.id, 'recebido')}>✓</Btn>
                  : <Btn size="sm" onClick={() => toggleStatus(r.id, 'previsto')}>↩</Btn>}
                <Btn size="sm" variant="danger" onClick={() => deletar(r.id)}>✕</Btn>
              </div>
            </Row>
          ))}
      </Card>

      {modal && (
        <Modal title="Nova Receita" onClose={() => setModal(false)}>
          <FormRow>
            <FormGroup label="Nome do aluno"><input value={form.nome} onChange={f('nome')} placeholder="Nome" /></FormGroup>
            <FormGroup label="Tipo">
              <select value={form.tipo} onChange={f('tipo')}>
                <option value="personal">Personal</option>
                <option value="consultoria">Consultoria</option>
                <option value="renovação">Renovação</option>
              </select>
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Subtipo">
              <select value={form.sub_tipo} onChange={f('sub_tipo')}>
                <option value="fixa">Fixa</option>
                <option value="variavel">Variável</option>
              </select>
            </FormGroup>
            <FormGroup label="Valor (R$)"><input type="number" value={form.valor} onChange={f('valor')} placeholder="0.00" /></FormGroup>
            <FormGroup label="Dia previsto"><input type="number" value={form.dia} onChange={f('dia')} placeholder="Dia" min="1" max="31" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Status">
              <select value={form.status} onChange={f('status')}>
                <option value="previsto">Previsto</option>
                <option value="recebido">Recebido</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </FormGroup>
            <FormGroup label="Recorrente">
              <select value={form.recorrente} onChange={f('recorrente')}>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </FormGroup>
          </FormRow>
          <FormGroup label="Observações"><input value={form.obs} onChange={f('obs')} placeholder="" /></FormGroup>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Btn variant="primary" onClick={salvar} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Btn>
            <Btn onClick={() => setModal(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </main>
  )
}
