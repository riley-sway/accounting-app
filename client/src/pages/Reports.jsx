import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { apiUrl } from '../lib/api'
import { formatCurrency } from '../lib/formatters'
import StatCard from '../components/ui/StatCard'
import RevenueChart from '../components/reports/RevenueChart'
import MonthlySummaryTable from '../components/reports/MonthlySummaryTable'
import Button from '../components/ui/Button'

const currentYear = String(new Date().getFullYear())

export default function Reports() {
  const [year, setYear] = useState(currentYear)

  const { data: years = [currentYear] } = useQuery({
    queryKey: ['report-years'],
    queryFn: () => api.get('/reports/years').then(r => r.data.length > 0 ? r.data : [currentYear]),
    staleTime: 0,
  })

  const { data: monthly = [], isLoading } = useQuery({
    queryKey: ['reports-monthly', year],
    queryFn: () => api.get(`/reports/monthly?year=${year}`).then((r) => r.data),
  })

  const totals = monthly.reduce(
    (acc, m) => ({
      invoicedCents: acc.invoicedCents + m.invoicedCents,
      paidCents: acc.paidCents + m.paidCents,
      outstandingCents: acc.outstandingCents + m.outstandingCents,
    }),
    { invoicedCents: 0, paidCents: 0, outstandingCents: 0 }
  )

  const handleExportPDF = () => {
    const a = document.createElement('a')
    a.href = apiUrl(`/reports/pdf?year=${year}`)
    a.download = `report-${year}.pdf`
    a.click()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <span
            className="text-[10px] font-bold tracking-widest uppercase block mb-2"
            style={{ color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
          >
            Financial Reports
          </span>
          <h2
            className="text-4xl font-extrabold tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}
          >
            Annual Summary
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-secondary)' }}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={handleExportPDF}>
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard
          label={`Total Invoiced ${year}`}
          valueCents={totals.invoicedCents}
          subtext="All non-draft invoices issued"
          icon="receipt_long"
        />
        <StatCard
          label={`Collected ${year}`}
          valueCents={totals.paidCents}
          subtext="Total payments received"
          icon="check_circle"
          accent="#10B981"
          borderColor="#10B981"
        />
        <StatCard
          label="Outstanding"
          valueCents={totals.outstandingCents}
          subtext="Pending + overdue invoices"
          icon="pending"
          accent={totals.outstandingCents > 0 ? '#F59E0B' : undefined}
          borderColor={totals.outstandingCents > 0 ? '#F59E0B' : undefined}
        />
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
        </div>
      ) : (
        <>
          <RevenueChart data={monthly} />
          <MonthlySummaryTable data={monthly} />
        </>
      )}
    </div>
  )
}
