import { useTheme } from '../../hooks/useTheme'

export default function Topbar({ search, onSearch, onMenuClick }) {
  const [dark, toggleTheme] = useTheme()

  return (
    <header
      className="fixed top-0 left-0 right-0 md:left-[280px] z-40 flex items-center justify-between px-4 md:px-8 border-b border-slate-200/50"
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-topbar)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'Manrope, sans-serif',
      }}
    >
      {/* Left: hamburger (mobile) + search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <div className="relative flex-1 max-w-xs hidden sm:block">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search invoices, clients…"
            value={search || ''}
            onChange={(e) => onSearch?.(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm rounded-lg w-full border-none outline-none focus:ring-2 focus:ring-slate-200"
            style={{ backgroundColor: 'var(--bg-subtle)', fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="Toggle dark mode">
          <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--text-secondary)' }}>
            {dark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button className="hidden sm:block p-2 rounded-full hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--text-secondary)' }}>notifications</span>
        </button>

        <div className="hidden sm:block h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Sway Creative</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Owner</p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: '#0F172A' }}
          >
            SC
          </div>
        </div>
      </div>
    </header>
  )
}
