import { useEffect } from 'react'

export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
  )
}
