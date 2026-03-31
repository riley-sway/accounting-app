import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '../../lib/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-lg">
        <p className="text-xs font-bold text-slate-600 mb-1">{label}</p>
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export default function CashflowChart({ data = [] }) {
  const maxVal = Math.max(...data.map((d) => d.totalCents), 1)

  const chartData = data.map((d) => ({
    month: d.month.slice(5), // MM
    totalCents: d.totalCents,
    label: new Date(d.month + '-15').toLocaleString('en-AU', { month: 'short' }),
  }))

  return (
    <div className="bg-white rounded-xl p-8 whisper-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}>
            Cashflow Horizon
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Monthly invoiced amounts — last 12 months
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-slate-50 rounded-full border border-slate-200" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
          Invoiced
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="totalCents" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.totalCents === maxVal && maxVal > 0 ? '#10B981' : '#e6e8ea'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
