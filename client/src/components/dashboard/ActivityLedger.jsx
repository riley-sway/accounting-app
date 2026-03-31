import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'
import { formatCurrency, formatDate } from '../../lib/formatters'

export default function ActivityLedger({ data = [] }) {
  return (
    <div className="bg-white rounded-xl p-8 whisper-shadow">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}>
            Activity Ledger
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Recent invoice events</p>
        </div>
        <Link
          to="/invoices"
          className="text-xs font-bold uppercase tracking-widest hover:underline"
          style={{ color: '#0F172A', fontFamily: 'Manrope, sans-serif' }}
        >
          View All
        </Link>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>No recent activity.</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[480px]">
          <thead>
            <tr
              className="text-[10px] font-bold uppercase tracking-widest border-b border-slate-100"
              style={{ color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
            >
              <th className="pb-4 font-bold">Invoice / Client</th>
              <th className="pb-4 font-bold">Status</th>
              <th className="pb-4 font-bold text-right">Amount</th>
              <th className="pb-4 font-bold text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((inv) => (
              <tr
                key={inv.id}
                className="group hover:bg-slate-50 transition-colors"
              >
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
                    >
                      {(inv.client?.businessName || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {inv.client?.businessName}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-secondary)' }}>
                        {inv.invoiceNumber}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <Badge status={inv.status} />
                </td>
                <td className="py-4 text-right font-bold text-sm" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}>
                  {formatCurrency(inv.totalCents)}
                </td>
                <td className="py-4 text-right text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(inv.issueDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
