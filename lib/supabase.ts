'use client'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'SUA_URL_AQUI') {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }
  _client = createClient(url, key)
  return _client
}

export type StatusReceita = 'previsto' | 'recebido' | 'atrasado'
export type StatusDespesa = 'previsto' | 'pago' | 'atrasado'
export type SubTipo = 'fixa' | 'variavel'
export type Modalidade = 'personal' | 'consultoria'

export interface Receita {
  id: string; nome: string; tipo: string; sub_tipo: SubTipo
  valor: number; dia: number; status: StatusReceita
  recorrente: boolean; obs: string; created_at?: string
}
export interface Despesa {
  id: string; nome: string; categoria: string; sub_tipo: SubTipo
  valor: number; dia: number; essencial: boolean
  status: StatusDespesa; recorrente: boolean; obs: string; created_at?: string
}
export interface Divida {
  id: string; nome: string; credor: string; valor_total: number
  valor_parcela: number; vencimento: number; atrasada: boolean
  prioridade: number; obs: string; pago: number; created_at?: string
}
export interface Aluno {
  id: string; nome: string; modalidade: Modalidade; valor: number
  frequencia: string; dia_pagamento: number; ativo: boolean; obs: string; created_at?: string
}
export interface CategoriaOrcamento {
  id: string; nome: string; icone: string; cor: string
  orcamento_mensal: number; essencial: boolean; ativo: boolean; obs: string; created_at?: string
}
export interface GastoFlexivel {
  id: string; categoria_id: string; descricao: string
  valor: number; data_gasto: string; obs: string; created_at?: string
}
