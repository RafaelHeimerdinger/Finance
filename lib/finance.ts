import type { Receita, Despesa, Divida } from './supabase'

export const TODAY_DAY = new Date().getDate()
export const DAYS_IN_MONTH = new Date(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  0
).getDate()

export function fmt(v: number) {
  return 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtShort(v: number) {
  const abs = Math.abs(v)
  const prefix = v < 0 ? '-' : ''
  if (abs >= 1000) return prefix + 'R$ ' + (abs / 1000).toFixed(1) + 'k'
  return prefix + 'R$ ' + abs.toFixed(0)
}

export interface CalcResult {
  recebido: number
  pagas: number
  saldoAtual: number
  comprometido: number
  livre: number
  previsto: number
  totalDividas: number
  pendFixed: number
  pendVar: number
}

export function calcFinancas(
  receitas: Receita[],
  despesas: Despesa[],
  dividas: Divida[]
): CalcResult {
  const recebido = receitas.filter(r => r.status === 'recebido').reduce((a, r) => a + r.valor, 0)
  const pagas = despesas.filter(d => d.status === 'pago').reduce((a, d) => a + d.valor, 0)
  const saldoAtual = recebido - pagas
  const pendFixed = despesas.filter(d => d.status !== 'pago' && d.sub_tipo === 'fixa').reduce((a, d) => a + d.valor, 0)
  const pendVar = despesas.filter(d => d.status !== 'pago' && d.sub_tipo === 'variavel').reduce((a, d) => a + d.valor, 0)
  const comprometido = pendFixed + pendVar
  const livre = saldoAtual - comprometido
  const previsto = receitas.filter(r => r.status === 'previsto').reduce((a, r) => a + r.valor, 0)
  const totalDividas = dividas.reduce((a, d) => a + (d.valor_total - d.pago), 0)
  return { recebido, pagas, saldoAtual, comprometido, livre, previsto, totalDividas, pendFixed, pendVar }
}

export interface ProjecaoDia {
  day: number
  saldo: number | null
  isToday: boolean
  hasEvent: boolean
}

export function calcProjection(
  receitas: Receita[],
  despesas: Despesa[],
  saldoAtual: number
): ProjecaoDia[] {
  const proj: ProjecaoDia[] = []

  for (let day = 1; day <= DAYS_IN_MONTH; day++) {
    if (day < TODAY_DAY) {
      proj.push({ day, saldo: null, isToday: false, hasEvent: false })
    } else {
      proj.push({ day, saldo: 0, isToday: day === TODAY_DAY, hasEvent: false })
    }
  }

  // Set today's actual balance
  proj[TODAY_DAY - 1].saldo = saldoAtual

  // Project forward
  let running = saldoAtual
  for (let i = TODAY_DAY; i < DAYS_IN_MONTH; i++) {
    const day = i + 1
    const entradas = receitas.filter(r => r.dia === day && r.status === 'previsto')
    const saidas = despesas.filter(d => d.dia === day && d.status !== 'pago')
    entradas.forEach(r => { running += r.valor })
    saidas.forEach(d => { running -= d.valor })
    proj[i].saldo = running
    proj[i].hasEvent = entradas.length > 0 || saidas.length > 0
  }

  return proj
}
