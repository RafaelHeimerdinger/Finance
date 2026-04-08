'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Aluno } from '@/lib/supabase'
import { fmt, fmtShort } from '@/lib/finance'
import { Card, KpiCard, Grid3, Badge, Row, Btn, Modal, FormRow, FormGroup, SectionTitle } from '@/components/ui'

type Form = { nome: string; modalidade: string; valor: string; frequencia: string; dia_pagamento: string; obs: string }
const empty: Form = { nome: '', modalidade: 'personal', valor: '', frequencia: '', dia_pagamento: '', obs: '' }

export default function Alunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Form>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await getSupabase().from('alunos').select('*').order('dia_pagamento')
    setAlunos(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const ativos = alunos.filter(a => a.ativo)
  const inativos = alunos.filter(a => !a.ativo)
  const totalMensal = ativos.reduce((s, a) => s + a.valor, 0)
  const ticketMedio = ativos.length ? totalMensal / ativos.length : 0

  async function toggleAtivo(id: string, ativo: boolean) {
    await getSupabase().from('alunos').update({ ativo: !ativo }).eq('id', id)
    load()
  }

  async function deletar(id: string) {
    if (!confirm('Remover este aluno?')) return
    await getSupabase().from('alunos').delete().eq('id', id)
    load()
  }

  async function salvar() {
    if (!form.nome || !form.valor) return alert('Preencha nome e valor.')
    setSaving(true)
    const aluno = {
      nome: form.nome, modalidade: form.modalidade,
      valor: parseFloat(form.valor), frequencia: form.frequencia,
      dia_pagamento: parseInt(form.dia_pagamento) || 1,
      ativo: true, obs: form.obs,
    }
    await getSupabase().from('alunos').insert(aluno)
    // Criar receita vinculada
    await getSupabase().from('receitas').insert({
      nome: form.nome, tipo: form.modalidade, sub_tipo: 'fixa',
      valor: parseFloat(form.valor), dia: parseInt(form.dia_pagamento) || 1,
      status: 'previsto', recorrente: true, obs: 'Criado via cadastro de aluno',
    })
    setSaving(false)
    setModal(false)
    setForm(empty)
    load()
  }

  function f(k: keyof Form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))
  }

  function initials(nome: string) {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  if (loading) return <p style={{ color: 'var(--text2)', padding: 24 }}>Carregando...</p>

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Alunos</h2>
        <Btn variant="primary" onClick={() => setModal(true)}>+ Adicionar</Btn>
      </div>

      <Grid3>
        <KpiCard label="Alunos Ativos"  value={String(ativos.length)}   color="blue" />
        <KpiCard label="Receita Mensal" value={fmtShort(totalMensal)}   color="green" />
        <KpiCard label="Ticket Médio"   value={fmtShort(ticketMedio)}   color="amber" />
      </Grid3>

      <SectionTitle>Alunos Ativos</SectionTitle>
      <Card>
        {ativos.sort((a, b) => a.dia_pagamento - b.dia_pagamento).map(a => (
          <Row key={a.id}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: a.modalidade === 'consultoria' ? 'var(--blue-bg)' : 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: a.modalidade === 'consultoria' ? 'var(--blue-text)' : 'var(--green-text)', flexShrink: 0 }}>
              {initials(a.nome)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{a.nome}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{a.modalidade} · {a.frequencia} · pag. dia {a.dia_pagamento}</div>
            </div>
            <Badge variant={a.modalidade === 'consultoria' ? 'blue' : 'green'}>{a.modalidade}</Badge>
            <span style={{ color: 'var(--green-text)', fontWeight: 600, fontSize: 13, minWidth: 80, textAlign: 'right' }}>{fmt(a.valor)}</span>
            <Btn size="sm" variant="danger" onClick={() => toggleAtivo(a.id, a.ativo)}>Inativar</Btn>
          </Row>
        ))}
      </Card>

      {inativos.length > 0 && (
        <>
          <SectionTitle>Inativos</SectionTitle>
          <Card>
            {inativos.map(a => (
              <Row key={a.id}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text3)', flexShrink: 0 }}>
                  {initials(a.nome)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{a.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.modalidade}</div>
                </div>
                <Badge variant="gray">inativo</Badge>
                <span style={{ color: 'var(--text3)', fontSize: 13 }}>{fmt(a.valor)}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn size="sm" onClick={() => toggleAtivo(a.id, a.ativo)}>Reativar</Btn>
                  <Btn size="sm" variant="danger" onClick={() => deletar(a.id)}>✕</Btn>
                </div>
              </Row>
            ))}
          </Card>
        </>
      )}

      {modal && (
        <Modal title="Novo Aluno" onClose={() => setModal(false)}>
          <FormRow>
            <FormGroup label="Nome"><input value={form.nome} onChange={f('nome')} placeholder="Nome do aluno" /></FormGroup>
            <FormGroup label="Modalidade">
              <select value={form.modalidade} onChange={f('modalidade')}>
                <option value="personal">Personal</option>
                <option value="consultoria">Consultoria</option>
              </select>
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Valor mensal (R$)"><input type="number" value={form.valor} onChange={f('valor')} placeholder="0.00" /></FormGroup>
            <FormGroup label="Frequência"><input value={form.frequencia} onChange={f('frequencia')} placeholder="ex: 3x/semana" /></FormGroup>
            <FormGroup label="Dia pagamento"><input type="number" value={form.dia_pagamento} onChange={f('dia_pagamento')} placeholder="Dia" min="1" max="31" /></FormGroup>
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
