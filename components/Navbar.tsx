'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/',           label: 'Início',    icon: '⬡' },
  { href: '/receitas',   label: 'Receitas',  icon: '↑' },
  { href: '/despesas',   label: 'Contas',    icon: '↓' },
  { href: '/gastos',     label: 'Gastos',    icon: '🛒' },
  { href: '/dividas',    label: 'Dívidas',   icon: '⚠' },
  { href: '/simulador',  label: 'Simular',   icon: '⇄' },
  { href: '/calendario', label: 'Agenda',    icon: '▦' },
  { href: '/alunos',     label: 'Alunos',    icon: '◎' },
]

export default function Navbar() {
  const path = usePathname()

  return (
    <>
      {/* Top bar — logo apenas */}
      <header style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue)', letterSpacing: '-.5px' }}>
          Ricci<span style={{ color: 'var(--text2)', fontWeight: 400 }}>Finance</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </div>
      </header>

      {/* Bottom navigation — mobile first */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg2)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {navItems.map(item => {
          const active = path === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 2px',
                textDecoration: 'none',
                color: active ? 'var(--blue-text)' : 'var(--text3)',
                borderTop: active ? '2px solid var(--blue)' : '2px solid transparent',
                transition: 'all .15s',
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: item.icon.length > 2 ? 18 : 16, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: 10, marginTop: 3, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
