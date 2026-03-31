import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Badge from '../ui/Badge'
import InvoicePDFPreviewModal from './InvoicePDFPreviewModal'
import { formatCurrency, formatDate } from '../../lib/formatters'
import api from '../../lib/api'

export default function InvoiceRow({ invoice }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPreview, setShowPreview] = useState(false)

  const changeStatus = useMutation({
    mutationFn: (status) => api.patch(`/invoices/${invoice.id}/status`, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] })
      toast.success(status === 'paid' ? `${invoice.invoiceNumber} marked as paid` : `${invoice.invoiceNumber} marked as unpaid`)
    },
    onError: () => toast.error('Failed to update status'),
  })

  const handleMarkPaid = () => {
    if (window.confirm(`Mark ${invoice.invoiceNumber} as paid?`)) changeStatus.mutate('paid')
  }

  const handleMarkUnpaid = () => {
    if (window.confirm(`Mark ${invoice.invoiceNumber} as unpaid? It will be set back to sent.`)) changeStatus.mutate('sent')
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = `/api/invoices/${invoice.id}/pdf`
    a.download = `${invoice.invoiceNumber}.pdf`
    a.click()
  }

  const daysLate = invoice.status === 'overdue'
    ? Math.floor((new Date() - new Date(invoice.dueDate + 'T12:00:00')) / 86400000)
    : null

  return (
    <>
      <tr className="group hover:bg-slate-50 transition-colors">
        <td className="px-8 py-5 font-bold text-xs" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}>
          {invoice.invoiceNumber}
        </td>
        <td className="px-8 py-5">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
            >
              {(invoice.client?.businessName || '').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {invoice.client?.businessName}
            </span>
          </div>
        </td>
        <td className="px-8 py-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(invoice.issueDate)}
        </td>
        <td className="px-8 py-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(invoice.dueDate)}
        </td>
        <td className="px-8 py-5 font-extrabold text-sm" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}>
          {formatCurrency(invoice.totalCents)}
        </td>
        <td className="px-8 py-5">
          {daysLate !== null ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700">
              <span className="material-symbols-outlined text-xs">priority_high</span>
              {daysLate}d Late
            </span>
          ) : (
            <Badge status={invoice.status} />
          )}
        </td>
        <td className="px-8 py-5 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowPreview(true)}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              title="Preview PDF"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              title="Download PDF"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
            <button
              onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              title="Edit"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <button
                onClick={handleMarkPaid}
                className="p-2 rounded-full hover:bg-emerald-50 transition-colors"
                title="Mark as Paid"
                style={{ color: '#10B981' }}
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </button>
            )}
            {invoice.status === 'paid' && (
              <button
                onClick={handleMarkUnpaid}
                className="p-2 rounded-full hover:bg-amber-50 transition-colors"
                title="Mark as Unpaid"
                style={{ color: '#F59E0B' }}
              >
                <span className="material-symbols-outlined text-[18px]">remove_done</span>
              </button>
            )}
          </div>
        </td>
      </tr>

      {showPreview && (
        <tr>
          <td colSpan={7}>
            <InvoicePDFPreviewModal invoice={invoice} onClose={() => setShowPreview(false)} />
          </td>
        </tr>
      )}
    </>
  )
}
