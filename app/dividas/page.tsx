'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Divida } from '@/lib/supabase'
import { fmt, fmtShort } from '@/lib/finance'
import { Card, KpiCard, Grid3, Badge, Btn, Modal, FormRow, FormGroup, SectionTitle, ProgressBar } from '@/components/ui'

type Form = { nome: string; credor: string; valor_total: string; valor_parcela: string; vencimento: string; atrasada: string; prioridade: string; obs: string }
const empty: Form = { nome: '', credor: '', valor_total: '', valor_parcela: '', vencimento: '', atrasada: 'false', prioridade: '3', obs: '' }

export default function Dividas() {
  const [dividas, setDividas] = useState<Divida[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Form>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await getSupabase().from('dividas').select('*').order('prioridade')
    setDividas(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const total = dividas.reduce((a, d) => a + d.valor_total, 0)
  const pago = dividas.reduce((a, d) => a + d.pago, 0)
  const restante = total - pago
  const atrasadas = dividas.filter(d => d.atrasada && d.pago < d.valor_total).length
  const pct = total > 0 ? Math.round(pago / total * 100) : 0

  async function pagarParcela(id: string, parcela: number, max: number) {
    const d = dividas.find(x => x.id === id)!
    const novoPago = Math.min(d.valor_total, d.pago + parcela)
    await getSupabase().from('dividas').update({ pago: novoPago, atrasada: novoPago >= d.valor_total ? false : d.atrasada }).eq('id', id)
    load()
  }

  async function quitar(id: string) {
    const d = dividas.find(x => x.id === id)!
    await getSupabase().from('dividas').update({ pago: d.valor_total, atrasada: false }).eq('id', id)
    load()
  }

  async function deletar(id: string) {
    if (!confirm('Remover esta dívida?')) return
    await getSupabase().from('dividas').delete().eq('id', id)
    load()
  }

  async function salvar() {
    if (!form.nome || !form.valor_total) return alert('Preencha nome e valor total.')
    setSaving(true)
    await getSupabase().from('dividas').insert({
      nome: form.nome, credor: form.credor, valor_total: parseFloat(form.valor_total),
      valor_parcela: parseFloat(form.valor_parcela) || 0, vencimento: parseInt(form.vencimento) || 1,
      atrasada: form.atrasada === 'true', prioridade: parseInt(form.prioridade) || 3, obs: form.obs, pago: 0,
    })
    setSaving(false)
    setModal(false)
    setForm(empty)
    load()
  }

  function f(k: keyof Form) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(prev => ({ ...prev, [k]: e.target.value })) }

  const prioColor = (p: number) => p === 1 ? 'var(--red)' : p === 2 ? 'var(--amber)' : 'var(--blue)'

  if (loading) return <p style={{ color: 'var(--text2)', padding: 24 }}>Carregando...</p>

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Dívidas</h2>
        <Btn variant="primary" onClick={() => setModal(true)}>+ Adicionar</Btn>
      </div>

      <Grid3>
        <KpiCard label="Total em Dívidas" value={fmtShort(restante)} color="red" />
        <KpiCard label="Já Quitado" value={fmtShort(pago)} color="green" />
        <KpiCard label="Em Atraso" value={`${atrasadas} dívida${atrasadas !== 1 ? 's' : ''}`} color="amber" />
      </Grid3>

      {pago > 0 && (
        <Card style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Progresso de Quitação</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-text)' }}>{pct}%</span>
          </div>
          <ProgressBar pct={pct} />
        </Card>
      )}

      <SectionTitle>Lista de Dívidas (por prioridade)</SectionTitle>
      <Card>
        {dividas.sort((a, b) => a.prioridade - b.prioridade).map(d => {
          const restD = d.valor_total - d.pago
          const pctD = d.valor_total > 0 ? Math.round(d.pago / d.valor_total * 100) : 0
          return (
            <div key={d.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: prioColor(d.prioridade), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{d.prioridade}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{d.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{d.credor} · Venc. dia {d.vencimento}</div>
                </div>
                <Badge variant={d.atrasada && restD > 0 ? 'red' : restD === 0 ? 'green' : 'gray'}>
                  {d.atrasada && restD > 0 ? 'atrasada' : restD === 0 ? 'quitada' : 'em dia'}
                </Badge>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red-text)', marginLeft: 4 }}>{fmt(restD)}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}><ProgressBar pct={pctD} /></div>
                <span style={{ fontSize: 10, color: 'var(--text2)', flexShrink: 0 }}>{pctD}%</span>
                {restD > 0 ? (
                  <>
                    <Btn size="sm" onClick={() => pagarParcela(d.id, d.valor_parcela, d.valor_total)}>Pagar parcela</Btn>
                    <Btn size="sm" variant="primary" onClick={() => quitar(d.id)}>Quitar total</Btn>
                    <Btn size="sm" variant="danger" onClick={() => deletar(d.id)}>✕</Btn>
                  </>
                ) : (
                  <>
                    <Badge variant="green">Quitada!</Badge>
                    <Btn size="sm" variant="danger" onClick={() => deletar(d.id)}>✕</Btn>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </Card>

      {modal && (
        <Modal title="Nova Dívida" onClose={() => setModal(false)}>
          <FormRow>
            <FormGroup label="Nome"><input value={form.nome} onChange={f('nome')} placeholder="Nome da dívida" /></FormGroup>
            <FormGroup label="Credor"><input value={form.credor} onChange={f('credor')} placeholder="Credor" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Valor total (R$)"><input type="number" value={form.valor_total} onChange={f('valor_total')} placeholder="0.00" /></FormGroup>
            <FormGroup label="Parcela (R$)"><input type="number" value={form.valor_parcela} onChange={f('valor_parcela')} placeholder="0.00" /></FormGroup>
            <FormGroup label="Vencimento (dia)"><input type="number" value={form.vencimento} onChange={f('vencimento')} placeholder="Dia" min="1" max="31" /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Atrasada?">
              <select value={form.atrasada} onChange={f('atrasada')}>
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </FormGroup>
            <FormGroup label="Prioridade (1=alta)"><input type="number" value={form.prioridade} onChange={f('prioridade')} min="1" max="10" /></FormGroup>
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
