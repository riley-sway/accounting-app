import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { formatCurrency } from '../lib/formatters'
import StatCard from '../components/ui/StatCard'
import CashflowChart from '../components/dashboard/CashflowChart'
import ActivityLedger from '../components/dashboard/ActivityLedger'

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/dashboard/summary').then((r) => r.data),
  })

  const { data: chartData = [] } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: () => api.get('/dashboard/monthly-chart').then((r) => r.data),
  })

  const { data: activity = [] } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => api.get('/dashboard/recent-activity').then((r) => r.data),
  })

  const overdueCents = summary?.statusCounts?.overdue?.totalCents || 0
  const overdueCount = summary?.statusCounts?.overdue?.count || 0
  const sentCount = summary?.statusCounts?.sent?.count || 0

  return (
    <div>
      {/* Header */}
      <section className="mb-10">
        <span
          className="text-[10px] font-bold tracking-widest uppercase block mb-3"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
        >
          Financial Overview
        </span>
        <h2
          className="text-5xl font-extrabold tracking-tight mb-2"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}
        >
          Performance Ledger
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your invoicing activity at a glance. {new Date().toLocaleString('en-AU', { month: 'long', year: 'numeric' })}.
        </p>
      </section>

      {/* Hero stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard
          label="Gross Invoiced (YTD)"
          valueCents={summary?.grossYTD || 0}
          subtext={`${(summary?.statusCounts?.paid?.count || 0)} invoices collected`}
          icon="check_circle"
          borderColor="#10B981"
        />
        <StatCard
          label="Outstanding Receivables"
          valueCents={summary?.outstandingCents || 0}
          subtext={`${sentCount} invoice${sentCount === 1 ? '' : 's'} pending payment`}
          icon="schedule"
        />
        <StatCard
          label="Overdue"
          valueCents={overdueCents}
          subtext={`${overdueCount} invoice${overdueCount === 1 ? '' : 's'} requiring attention`}
          icon="warning"
          accent={overdueCount > 0 ? '#F59E0B' : undefined}
          borderColor={overdueCount > 0 ? '#F59E0B' : undefined}
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="col-span-1 lg:col-span-7">
          <CashflowChart data={chartData} />
        </div>
        <div className="col-span-1 lg:col-span-5">
          <ActivityLedger data={activity} />
        </div>
      </div>
    </div>
  )
}
