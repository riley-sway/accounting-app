import { STATUS_COLORS } from '../../lib/constants'
import { formatStatus } from '../../lib/formatters'

export default function Badge({ status, className = '' }) {
  const colorClass = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colorClass} ${className}`}
    >
      {formatStatus(status)}
    </span>
  )
}
