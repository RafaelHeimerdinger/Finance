'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/',           label: 'Dashboard',   icon: '⬡' },
  { href: '/receitas',   label: 'Receitas',    icon: '↑' },
  { href: '/despesas',   label: 'Despesas',    icon: '↓' },
  { href: '/dividas',    label: 'Dívidas',     icon: '⚠' },
  { href: '/calendario', label: 'Calendário',  icon: '▦' },
  { href: '/alunos',     label: 'Alunos',      icon: '◎' },
  { href: '/simulador',  label: 'Simulador',   icon: '⇄' },
]

export default function Navbar() {
  const path = usePathname()
  return (
    <header style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--blue)', letterSpacing: '-.5px', flexShrink: 0 }}>
        Ricci<span style={{ color: 'var(--text2)', fontWeight: 400 }}>Finance</span>
      </div>
      <nav style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', flex: 1 }}>
        {navItems.map(item => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: active ? 'var(--blue)' : 'transparent',
              color: active ? '#fff' : 'var(--text2)',
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              transition: 'all .15s',
            }}>
              {item.icon} {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
