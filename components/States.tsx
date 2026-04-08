'use client'

export function LoadingScreen() {
  return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>
      <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
      <div style={{ fontSize: 14 }}>Carregando...</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const isConfig = message.includes('Supabase') || message.includes('variáveis') || message.includes('SUPABASE')

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--red-text)', marginBottom: 8 }}>
          {isConfig ? 'Supabase não configurado' : 'Erro ao carregar dados'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>
          {message}
        </div>

        {isConfig && (
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, fontWeight: 600 }}>Como resolver:</div>
            <ol style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
              <li>Acesse <strong style={{ color: 'var(--text)' }}>vercel.com</strong> → seu projeto</li>
              <li>Vá em <strong style={{ color: 'var(--text)' }}>Settings → Environment Variables</strong></li>
              <li>Adicione <code style={{ background: 'var(--bg4)', padding: '1px 4px', borderRadius: 4, fontSize: 11 }}>NEXT_PUBLIC_SUPABASE_URL</code></li>
              <li>Adicione <code style={{ background: 'var(--bg4)', padding: '1px 4px', borderRadius: 4, fontSize: 11 }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
              <li>Vá em <strong style={{ color: 'var(--text)' }}>Deployments → Redeploy</strong></li>
            </ol>
          </div>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  )
}
