'use client'
import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from './supabase'
import type { Receita, Despesa, Divida, Aluno } from './supabase'

export type FetchState<T> = { data: T; loading: boolean; error: string | null }

export function useSupabaseQuery<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): FetchState<T> & { reload: () => void } {
  const [state, setState] = useState<FetchState<T>>({ data: null as T, loading: true, error: null })

  const run = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      getSupabase() // valida configuração
      const data = await fetcher()
      setState({ data, loading: false, error: null })
    } catch (e: any) {
      const msg = e?.message === 'SUPABASE_NOT_CONFIGURED'
        ? 'Variáveis de ambiente do Supabase não configuradas. Veja o README.'
        : `Erro ao carregar dados: ${e?.message || 'desconhecido'}`
      setState({ data: null as T, loading: false, error: msg })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])

  return { ...state, reload: run }
}

// Hook que carrega todos os dados financeiros de uma vez
export function useFinanceData() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [dividas, setDividas] = useState<Divida[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const sb = getSupabase()
      const [r, d, dv, a] = await Promise.all([
        sb.from('receitas').select('*').order('dia'),
        sb.from('despesas').select('*').order('dia'),
        sb.from('dividas').select('*').order('prioridade'),
        sb.from('alunos').select('*').order('dia_pagamento'),
      ])
      if (r.error) throw r.error
      setReceitas(r.data || [])
      setDespesas(d.data || [])
      setDividas(dv.data || [])
      setAlunos(a.data || [])
    } catch (e: any) {
      const msg = e?.message === 'SUPABASE_NOT_CONFIGURED'
        ? 'Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no Vercel → Settings → Environment Variables.'
        : `Erro: ${e?.message || 'Verifique o console para mais detalhes.'}`
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { receitas, despesas, dividas, alunos, loading, error, reload: load }
}
