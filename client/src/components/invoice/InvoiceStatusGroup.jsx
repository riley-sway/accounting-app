import InvoiceRow from './InvoiceRow'
import { STATUS_DOT } from '../../lib/constants'
import { formatStatus } from '../../lib/formatters'

export default function InvoiceStatusGroup({ status, invoices }) {
  if (!invoices || invoices.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status] || 'bg-slate-400'}`} />
          <h4
            className="font-bold text-sm uppercase tracking-widest"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}
          >
            {formatStatus(status)}
          </h4>
          <span
            className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#0F172A' }}
          >
            {invoices.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
            >
              <th className="px-8 py-5 font-bold">Invoice #</th>
              <th className="px-8 py-5 font-bold">Client</th>
              <th className="px-8 py-5 font-bold">Issue Date</th>
              <th className="px-8 py-5 font-bold">Due Date</th>
              <th className="px-8 py-5 font-bold">Amount</th>
              <th className="px-8 py-5 font-bold">Status</th>
              <th className="px-8 py-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
