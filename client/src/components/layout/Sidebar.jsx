import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/invoices', icon: 'receipt_long', label: 'Invoices' },
  { to: '/clients', icon: 'group', label: 'Clients' },
  { to: '/reports', icon: 'bar_chart', label: 'Reports' },
]

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()

  const handleNav = (to) => {
    navigate(to)
    onClose?.()
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-[280px] z-50 flex flex-col py-6 shadow-2xl transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
        style={{ backgroundColor: '#0F172A' }}
      >
        {/* Logo */}
        <div className="px-8 mb-10 flex items-center justify-between">
          <img
            src="/sway-logo-white-transparent.png"
            alt="Sway Creative"
            className="h-9 object-contain"
          />
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-4 py-3 rounded text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif' }}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Create Invoice CTA */}
        <div className="px-4 pb-4">
          <button
            onClick={() => { navigate('/invoices/new'); onClose?.() }}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded text-white font-bold text-xs uppercase tracking-widest transition-colors"
            style={{ backgroundColor: '#131b2e', fontFamily: 'Manrope, sans-serif' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e2d47')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#131b2e')}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Invoice
          </button>
        </div>

        {/* Footer links */}
        <div className="border-t border-white/10 pt-4 space-y-1 px-2">
          <a
            href="#"
            className="flex items-center gap-3 mx-2 px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">contact_support</span>
            <span style={{ fontFamily: 'Manrope, sans-serif' }}>Support</span>
          </a>
        </div>
      </aside>
    </>
  )
}
