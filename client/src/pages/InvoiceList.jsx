import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { formatCurrency } from '../lib/formatters'
import { STATUS_ORDER } from '../lib/constants'
import StatCard from '../components/ui/StatCard'
import InvoiceStatusGroup from '../components/invoice/InvoiceStatusGroup'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

export default function InvoiceList() {
  const navigate = useNavigate()
  const { search = '' } = useOutletContext() || {}
  const [statusFilter, setStatusFilter] = useState('')

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/dashboard/summary').then((r) => r.data),
  })

  // Group by status, filtered by search and status dropdown
  const q = search.toLowerCase()
  const grouped = {}
  invoices.forEach((inv) => {
    if (statusFilter && inv.status !== statusFilter) return
    if (q && !(
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.client?.businessName.toLowerCase().includes(q)
    )) return
    ;(grouped[inv.status] ||= []).push(inv)
  })

  const hasInvoices = invoices.length > 0

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <span
            className="text-[10px] font-bold tracking-widest uppercase block mb-2"
            style={{ color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
          >
            Portfolio Overview
          </span>
          <h2
            className="text-4xl font-extrabold tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}
          >
            Invoice Ledger
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-secondary)' }}
          >
            <option value="">All Statuses</option>
            <option value="overdue">Overdue</option>
            <option value="sent">Pending</option>
            <option value="paid">Paid</option>
            <option value="draft">Draft</option>
          </select>
          <Button onClick={() => navigate('/invoices/new')}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <StatCard
          label="Overdue"
          valueCents={summary?.statusCounts?.overdue?.totalCents || 0}
          subtext={`${summary?.statusCounts?.overdue?.count || 0} invoices requiring attention`}
          icon="warning"
          accent={summary?.statusCounts?.overdue?.count > 0 ? '#F59E0B' : undefined}
          borderColor={summary?.statusCounts?.overdue?.count > 0 ? '#F59E0B' : undefined}
        />
        <StatCard
          label="Pending Collection"
          valueCents={summary?.statusCounts?.sent?.totalCents || 0}
          subtext={`${summary?.statusCounts?.sent?.count || 0} awaiting settlement`}
          icon="schedule"
        />
        <StatCard
          label="Paid (YTD)"
          valueCents={summary?.paidYTD || 0}
          subtext={`${summary?.statusCounts?.paid?.count || 0} collected invoices`}
          icon="check_circle"
          accent="#10B981"
          borderColor="#10B981"
        />
      </div>

      {/* Invoice groups */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
        </div>
      ) : !hasInvoices ? (
        <EmptyState
          icon="receipt_long"
          title="No invoices yet"
          description="Create your first invoice to get started."
          action={
            <Button onClick={() => navigate('/invoices/new')}>
              <span className="material-symbols-outlined text-[16px]">add</span>
              Create Invoice
            </Button>
          }
        />
      ) : (
        <>
          {STATUS_ORDER.map((status) => (
            <InvoiceStatusGroup
              key={status}
              status={status}
              invoices={grouped[status]}
            />
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-center py-12 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No invoices match the selected filter.
            </p>
          )}
        </>
      )}
    </div>
  )
}
