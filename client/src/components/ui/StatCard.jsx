import { formatCurrency } from '../../lib/formatters'

export default function StatCard({ label, valueCents, valueText, subtext, icon, accent, borderColor }) {
  return (
    <div
      className="bg-white rounded-xl p-8 whisper-shadow"
      style={{ borderLeft: borderColor ? `4px solid ${borderColor}` : undefined }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-4"
        style={{ color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: accent || 'var(--text-primary)', fontFamily: 'Manrope, sans-serif' }}
        >
          {valueText ?? formatCurrency(valueCents ?? 0)}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>CAD</span>
      </div>
      {subtext && (
        <p className="text-xs mt-3 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          {icon && (
            <span className="material-symbols-outlined text-[16px]" style={{ color: accent || 'var(--text-secondary)' }}>
              {icon}
            </span>
          )}
          {subtext}
        </p>
      )}
    </div>
  )
}
