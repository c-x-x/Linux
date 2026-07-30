import { useEffect, useState, type ReactNode } from 'react'
import {
  BookOpen,
  Box,
  Command,
  Cpu,
  Info,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { NavLink } from './AppLink'

const navItems = [
  { to: '/install', label: '装系统', icon: Box },
  { to: '/lab', label: '命令行', icon: Command },
  { to: '/commands', label: '命令库', icon: Cpu },
  { to: '/courses', label: '课程', icon: BookOpen },
  { to: '/about', label: '关于', icon: Info },
]

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return localStorage.getItem('kernel-lab-theme') === 'light'
      ? 'light'
      : 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('kernel-lab-theme', theme)
  }, [theme])

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Kernel Lab 首页">
          <span className="brand__mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>Kernel Lab</strong>
            <small>Embedded Linux Studio</small>
          </span>
        </NavLink>

        <nav className={menuOpen ? 'nav nav--open' : 'nav'} aria-label="主导航">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive ? 'nav__link nav__link--active' : 'nav__link'
              }
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar__actions">
          <span className="local-badge">
            <span className="local-badge__dot" />
            本机运行
          </span>
          <button
            className="icon-button"
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? '切换浅色主题' : '切换深色主题'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="icon-button menu-button"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      <main className="main-content">{children}</main>
      <footer className="footer">
        <span>Kernel Lab · 浏览器内 Linux 学习环境</span>
        <span>命令在浏览器内 Linux 环境执行，不上传终端内容</span>
      </footer>
    </div>
  )
}
