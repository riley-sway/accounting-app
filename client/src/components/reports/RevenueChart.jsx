import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '../../lib/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-lg text-sm">
        <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function RevenueChart({ data = [] }) {
  const chartData = data.map((d) => ({
    month: new Date(d.month + '-15').toLocaleString('en-AU', { month: 'short' }),
    Invoiced: d.invoicedCents,
    Collected: d.paidCents,
  }))

  return (
    <div className="bg-white rounded-xl p-8 whisper-shadow mb-8">
      <h3
        className="text-xl font-bold mb-6"
        style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}
      >
        Monthly Revenue
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} barSize={18} barGap={4} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-secondary)' }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
          />
          <Bar dataKey="Invoiced" fill="#0F172A" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Collected" fill="#10B981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
