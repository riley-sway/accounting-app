import { formatCurrency } from '../../lib/formatters'

export default function MonthlySummaryTable({ data = [] }) {
  const totals = data.reduce(
    (acc, m) => ({
      invoicedCents: acc.invoicedCents + m.invoicedCents,
      paidCents: acc.paidCents + m.paidCents,
      outstandingCents: acc.outstandingCents + m.outstandingCents,
      count: acc.count + m.count,
    }),
    { invoicedCents: 0, paidCents: 0, outstandingCents: 0, count: 0 }
  )

  return (
    <div className="bg-white rounded-xl whisper-shadow overflow-x-auto">
      <table className="w-full text-left min-w-[540px]">
        <thead>
          <tr
            style={{ backgroundColor: '#0F172A', color: '#ffffff', fontFamily: 'Manrope, sans-serif' }}
          >
            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest">Month</th>
            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-right">Invoiced</th>
            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-right">Collected</th>
            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-right">Outstanding</th>
            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-right">Invoices</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const monthName = new Date(row.month + '-15').toLocaleString('en-AU', { month: 'long', year: 'numeric' })
            return (
              <tr key={row.month} style={{ backgroundColor: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-subtle)' }}>
                <td className="px-8 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {monthName}
                </td>
                <td className="px-8 py-4 text-sm text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {row.invoicedCents > 0 ? formatCurrency(row.invoicedCents) : '—'}
                </td>
                <td className="px-8 py-4 text-sm text-right font-semibold" style={{ color: '#10B981' }}>
                  {row.paidCents > 0 ? formatCurrency(row.paidCents) : '—'}
                </td>
                <td className="px-8 py-4 text-sm text-right font-semibold" style={{ color: row.outstandingCents > 0 ? '#F59E0B' : 'var(--text-secondary)' }}>
                  {row.outstandingCents > 0 ? formatCurrency(row.outstandingCents) : '—'}
                </td>
                <td className="px-8 py-4 text-sm text-right" style={{ color: 'var(--text-secondary)' }}>
                  {row.count}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: 'var(--bg-subtle)', fontFamily: 'Manrope, sans-serif' }}>
            <td className="px-8 py-5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Total
            </td>
            <td className="px-8 py-5 text-sm text-right font-extrabold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(totals.invoicedCents)}
            </td>
            <td className="px-8 py-5 text-sm text-right font-extrabold" style={{ color: '#10B981' }}>
              {formatCurrency(totals.paidCents)}
            </td>
            <td className="px-8 py-5 text-sm text-right font-extrabold" style={{ color: '#F59E0B' }}>
              {formatCurrency(totals.outstandingCents)}
            </td>
            <td className="px-8 py-5 text-sm text-right font-bold" style={{ color: 'var(--text-secondary)' }}>
              {totals.count}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
