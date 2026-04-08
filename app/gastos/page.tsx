'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { CategoriaOrcamento, GastoFlexivel } from '@/lib/supabase'

function fmt(v: number) {
  return 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function dataHoje() {
  return new Date().toISOString().split('T')[0]
}

function getMesAtual() {
  const now = new Date()
  return { ano: now.getFullYear(), mes: now.getMonth() + 1 }
}

interface CatComGastos extends CategoriaOrcamento {
  gastos: GastoFlexivel[]
  totalGasto: number
  saldo: number
  pct: number
}

type ModalState =
  | { tipo: 'novoGasto'; catId: string; catNome: string }
  | { tipo: 'novaCategoria' }
  | { tipo: 'historico'; cat: CatComGastos }
  | null

export default function GastosPage() {
  const [cats, setCats] = useState<CatComGastos[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)
  const [saving, setSaving] = useState(false)

  // Form — novo gasto
  const [gDescricao, setGDescricao] = useState('')
  const [gValor, setGValor] = useState('')
  const [gData, setGData] = useState(dataHoje())
  const [gObs, setGObs] = useState('')

  // Form — nova categoria
  const [cNome, setCNome] = useState('')
  const [cIcone, setCIcone] = useState('💰')
  const [cCor, setCCor] = useState('#3b82f6')
  const [cOrcamento, setCOrcamento] = useState('')
  const [cEssencial, setCEssencial] = useState('false')

  const load = useCallback(async () => {
    const sb = getSupabase()
    const { mes, ano } = getMesAtual()
    const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`
    const fimMes = `${ano}-${String(mes).padStart(2, '0')}-31`

    const [{ data: categs }, { data: gastos }] = await Promise.all([
      sb.from('categorias_orcamento').select('*').eq('ativo', true).order('nome'),
      sb.from('gastos_flexiveis').select('*')
        .gte('data_gasto', inicioMes)
        .lte('data_gasto', fimMes)
        .order('data_gasto', { ascending: false }),
    ])

    const lista: CatComGastos[] = (categs || []).map(cat => {
      const meus = (gastos || []).filter(g => g.categoria_id === cat.id)
      const total = meus.reduce((a, g) => a + g.valor, 0)
      return {
        ...cat,
        gastos: meus,
        totalGasto: total,
        saldo: cat.orcamento_mensal - total,
        pct: cat.orcamento_mensal > 0 ? Math.min(100, Math.round(total / cat.orcamento_mensal * 100)) : 0,
      }
    })
    setCats(lista)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function salvarGasto() {
    if (!gDescricao || !gValor || modal?.tipo !== 'novoGasto') return
    setSaving(true)
    await getSupabase().from('gastos_flexiveis').insert({
      categoria_id: modal.catId,
      descricao: gDescricao,
      valor: parseFloat(gValor),
      data_gasto: gData,
      obs: gObs,
    })
    setSaving(false)
    setGDescricao(''); setGValor(''); setGData(dataHoje()); setGObs('')
    setModal(null)
    load()
  }

  async function deletarGasto(id: string) {
    if (!confirm('Remover este gasto?')) return
    await getSupabase().from('gastos_flexiveis').delete().eq('id', id)
    load()
  }

  async function salvarCategoria() {
    if (!cNome || !cOrcamento) return alert('Preencha nome e orçamento.')
    setSaving(true)
    await getSupabase().from('categorias_orcamento').insert({
      nome: cNome, icone: cIcone, cor: cCor,
      orcamento_mensal: parseFloat(cOrcamento),
      essencial: cEssencial === 'true', ativo: true, obs: '',
    })
    setSaving(false)
    setCNome(''); setCIcone('💰'); setCCor('#3b82f6'); setCOrcamento(''); setCEssencial('false')
    setModal(null)
    load()
  }

  async function deletarCategoria(id: string) {
    if (!confirm('Remover esta categoria e todos os gastos dela?')) return
    await getSupabase().from('categorias_orcamento').delete().eq('id', id)
    load()
  }

  const { mes, ano } = getMesAtual()
  const mesNome = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  const totalOrcado = cats.reduce((a, c) => a + c.orcamento_mensal, 0)
  const totalGasto = cats.reduce((a, c) => a + c.totalGasto, 0)
  const totalLivre = totalOrcado - totalGasto
  const catsCriticas = cats.filter(c => c.pct >= 80)

  if (loading) return (
    <div style={{ padding: 24, color: 'var(--text2)', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
      Carregando...
    </div>
  )

  return (
    <main style={{ padding: 16, paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Gastos Flexíveis</h2>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, textTransform: 'capitalize' }}>{mesNome}</div>
        </div>
        <button
          onClick={() => setModal({ tipo: 'novaCategoria' })}
          style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          + Categoria
        </button>
      </div>

      {/* Resumo mensal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Orçado', val: totalOrcado, color: 'var(--text)' },
          { label: 'Gasto', val: totalGasto, color: 'var(--amber-text)' },
          { label: 'Sobrou', val: totalLivre, color: totalLivre >= 0 ? 'var(--green-text)' : 'var(--red-text)' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color }}>{fmt(val)}</div>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {catsCriticas.length > 0 && (
        <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--amber-text)', display: 'flex', gap: 8 }}>
          <span>⚠</span>
          <span>{catsCriticas.map(c => c.nome).join(', ')} {catsCriticas.length === 1 ? 'está' : 'estão'} perto do limite.</span>
        </div>
      )}

      {/* Cards de categoria */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cats.map(cat => {
          const estourrou = cat.pct >= 100
          const critico = cat.pct >= 80 && cat.pct < 100
          const barColor = estourrou ? 'var(--red)' : critico ? 'var(--amber)' : 'var(--green)'

          return (
            <div key={cat.id} style={{ background: 'var(--bg2)', border: `1px solid ${estourrou ? 'var(--red)' : 'var(--border)'}`, borderRadius: 14, overflow: 'hidden' }}>
              {/* Linha principal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 10px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: cat.cor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {cat.icone}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{cat.nome}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)', flexShrink: 0, marginLeft: 8 }}>
                      {fmt(cat.totalGasto)} <span style={{ color: 'var(--text3)' }}>/ {fmt(cat.orcamento_mensal)}</span>
                    </span>
                  </div>
                  {/* Barra de progresso */}
                  <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: cat.pct + '%', background: barColor, borderRadius: 3, transition: 'width .4s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: cat.pct >= 80 ? barColor : 'var(--text3)' }}>{cat.pct}% usado</span>
                    <span style={{ fontSize: 11, color: cat.saldo >= 0 ? 'var(--green-text)' : 'var(--red-text)', fontWeight: 600 }}>
                      {cat.saldo >= 0 ? 'Sobram ' : 'Excedeu '}{fmt(Math.abs(cat.saldo))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Últimos gastos mini */}
              {cat.gastos.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '8px 14px' }}>
                  {cat.gastos.slice(0, 2).map(g => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', fontSize: 12 }}>
                      <span style={{ color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                        {new Date(g.data_gasto + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {g.descricao}
                      </span>
                      <span style={{ color: 'var(--red-text)', fontWeight: 600, flexShrink: 0 }}>{fmt(g.valor)}</span>
                    </div>
                  ))}
                  {cat.gastos.length > 2 && (
                    <button
                      onClick={() => setModal({ tipo: 'historico', cat })}
                      style={{ background: 'none', border: 'none', color: 'var(--blue-text)', fontSize: 11, cursor: 'pointer', padding: '4px 0', marginTop: 2 }}
                    >
                      Ver todos os {cat.gastos.length} gastos →
                    </button>
                  )}
                </div>
              )}

              {/* Botões */}
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => { setModal({ tipo: 'novoGasto', catId: cat.id, catNome: cat.nome }); setGData(dataHoje()) }}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', background: cat.cor + '33', color: cat.cor, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Lançar gasto
                </button>
                {cat.gastos.length > 0 && (
                  <button
                    onClick={() => setModal({ tipo: 'historico', cat })}
                    style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}
                  >
                    Histórico
                  </button>
                )}
                <button
                  onClick={() => deletarCategoria(cat.id)}
                  style={{ padding: '9px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontSize: 13, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {cats.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 14 }}>Nenhuma categoria ainda.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Crie uma categoria como Gasolina, Mercado, iFood...</div>
        </div>
      )}

      {/* ─── MODAL: Novo gasto ─── */}
      {modal?.tipo === 'novoGasto' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', width: '100%', maxWidth: 500 }}>
            <div style={{ width: 40, height: 4, background: 'var(--bg4)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              + Gasto em <span style={{ color: 'var(--blue-text)' }}>{modal.catNome}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Descrição</div>
                <input value={gDescricao} onChange={e => setGDescricao(e.target.value)} placeholder="ex: Abastecimento posto Shell" style={{ fontSize: 16 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Valor (R$)</div>
                  <input type="number" value={gValor} onChange={e => setGValor(e.target.value)} placeholder="0.00" style={{ fontSize: 16 }} inputMode="decimal" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Data</div>
                  <input type="date" value={gData} onChange={e => setGData(e.target.value)} style={{ fontSize: 14 }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Observação (opcional)</div>
                <input value={gObs} onChange={e => setGObs(e.target.value)} placeholder="" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={salvarGasto} disabled={saving} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setModal(null)} style={{ padding: '13px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 15, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Nova categoria ─── */}
      {modal?.tipo === 'novaCategoria' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', width: '100%', maxWidth: 500 }}>
            <div style={{ width: 40, height: 4, background: 'var(--bg4)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Nova Categoria</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Ícone</div>
                  <input value={cIcone} onChange={e => setCIcone(e.target.value)} placeholder="⛽" style={{ textAlign: 'center', fontSize: 22 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Nome</div>
                  <input value={cNome} onChange={e => setCNome(e.target.value)} placeholder="ex: Gasolina" style={{ fontSize: 16 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Orçamento mensal (R$)</div>
                  <input type="number" value={cOrcamento} onChange={e => setCOrcamento(e.target.value)} placeholder="450" style={{ fontSize: 16 }} inputMode="decimal" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Cor</div>
                  <input type="color" value={cCor} onChange={e => setCCor(e.target.value)} style={{ height: 40, padding: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Essencial?</div>
                <select value={cEssencial} onChange={e => setCEssencial(e.target.value)}>
                  <option value="false">Não (cortável se apertar)</option>
                  <option value="true">Sim (necessária)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={salvarCategoria} disabled={saving} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
                {saving ? 'Salvando...' : 'Criar categoria'}
              </button>
              <button onClick={() => setModal(null)} style={{ padding: '13px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 15, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Histórico ─── */}
      {modal?.tipo === 'historico' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', width: '100%', maxWidth: 500, maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 40, height: 4, background: 'var(--bg4)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>{modal.cat.icone}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{modal.cat.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Total: {fmt(modal.cat.totalGasto)} / {fmt(modal.cat.orcamento_mensal)}</div>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {modal.cat.gastos.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.2, flexShrink: 0 }}>
                    {new Date(g.data_gasto + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{g.descricao}</div>
                    {g.obs && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{g.obs}</div>}
                  </div>
                  <span style={{ color: 'var(--red-text)', fontWeight: 700, fontSize: 14 }}>{fmt(g.valor)}</span>
                  <button onClick={() => deletarGasto(g.id)} style={{ background: 'var(--red-bg)', border: 'none', color: 'var(--red-text)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
