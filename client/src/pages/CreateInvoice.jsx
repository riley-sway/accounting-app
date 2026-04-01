import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api, { apiUrl } from '../lib/api'
import { formatCurrency } from '../lib/formatters'
import { PAYMENT_TERMS } from '../lib/constants'
import Button from '../components/ui/Button'
import LineItemRow from '../components/invoice/LineItemRow'
import TaxRatesModal from '../components/invoice/TaxRatesModal'
import ClientFormModal from '../components/client/ClientFormModal'
import { useServiceDescriptions } from '../hooks/useServiceDescriptions'
import { useTaxRates } from '../hooks/useTaxRates'

const emptyLineItem = () => ({ service: '', detail: '', quantity: 100, unitPriceCents: 0 })

export default function CreateInvoice() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const queryClient = useQueryClient()

  const defaultIssueDate = new Date().toISOString().split('T')[0]
  const defaultDueDate = (() => {
    const d = new Date(defaultIssueDate + 'T12:00:00')
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })()

  const [form, setForm] = useState({
    clientId: '',
    issueDate: defaultIssueDate,
    dueDate: defaultDueDate,
    paymentTerms: 'NET_30',
    taxRate: 0,
    taxLabel: 'Zero-rated',
    notes: '',
    status: 'draft',
  })
  const [lineItems, setLineItems] = useState([emptyLineItem()])
  const [services, addService] = useServiceDescriptions()
  const [taxRates, addTaxRate, removeTaxRate] = useTaxRates()
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('—')

  // Load next invoice number (for new invoices)
  const { data: nextNum } = useQuery({
    queryKey: ['next-invoice-number'],
    queryFn: () => api.get('/invoices/next-number').then((r) => r.data.invoiceNumber),
    enabled: !isEdit,
  })
  useEffect(() => { if (nextNum) setInvoiceNumber(nextNum) }, [nextNum])

  // Load existing invoice for edit
  const { data: existingInvoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoices/${id}`).then((r) => r.data),
    enabled: isEdit,
  })
  useEffect(() => {
    if (existingInvoice) {
      setInvoiceNumber(existingInvoice.invoiceNumber)
      setForm({
        clientId: existingInvoice.clientId,
        issueDate: existingInvoice.issueDate,
        dueDate: existingInvoice.dueDate,
        paymentTerms: existingInvoice.paymentTerms || 'NET_30',
        taxRate: existingInvoice.taxRate,
        taxLabel: existingInvoice.taxLabel || 'GST',
        notes: existingInvoice.notes || '',
        status: existingInvoice.status,
      })
      setLineItems(
        existingInvoice.lineItems.map((li) => ({
          service: li.description,
          detail: '',
          quantity: li.quantity,
          unitPriceCents: li.unitPriceCents,
        }))
      )
    }
  }, [existingInvoice])

  // Clients list
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then((r) => r.data),
  })

  // Tax preset logic
  const handleTaxPreset = (index) => {
    if (index === 'manage') { setShowTaxModal(true); return }
    const preset = taxRates[Number(index)]
    if (!preset) return
    setForm((f) => ({ ...f, taxRate: preset.value, taxLabel: preset.taxLabel }))
  }

  // Auto-set due date from issue date + terms
  const updateDueDate = (issueDate, terms) => {
    if (!issueDate || !terms || terms === 'DUE_ON_RECEIPT') {
      if (terms === 'DUE_ON_RECEIPT') setForm((f) => ({ ...f, dueDate: issueDate }))
      return
    }
    const days = { NET_7: 7, NET_14: 14, NET_30: 30, NET_60: 60 }[terms]
    if (days) {
      const d = new Date(issueDate + 'T12:00:00')
      d.setDate(d.getDate() + days)
      setForm((f) => ({ ...f, dueDate: d.toISOString().split('T')[0] }))
    }
  }

  // Totals
  const subtotalCents = lineItems.reduce((s, li) => s + Math.round((li.quantity / 100) * li.unitPriceCents), 0)
  const taxCents = Math.round((subtotalCents * form.taxRate) / 10000)
  const totalCents = subtotalCents + taxCents

  // Line item handlers
  const updateLineItem = (index, updated) => {
    setLineItems((items) => items.map((li, i) => (i === index ? updated : li)))
  }
  const addLineItem = () => setLineItems((items) => [...items, emptyLineItem()])
  const removeLineItem = (index) => setLineItems((items) => items.filter((_, i) => i !== index))

  // Submit
  const [pendingPDF, setPendingPDF] = useState(null) // 'download' | 'print' | null
  const [pendingMailto, setPendingMailto] = useState(null)

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? api.put(`/invoices/${id}`, payload)
        : api.post('/invoices', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] })
      queryClient.invalidateQueries({ queryKey: ['next-invoice-number'] })
      if (pendingMailto) {
        window.location.href = pendingMailto
        setPendingMailto(null)
        toast.success(`${res.data.invoiceNumber} created`)
        navigate('/invoices')
      } else if (pendingPDF) {
        const savedId = res.data.id
        const savedNum = res.data.invoiceNumber
        if (pendingPDF === 'download') {
          const a = document.createElement('a')
          a.href = apiUrl(`/invoices/${savedId}/pdf`)
          a.download = `${savedNum}.pdf`
          a.click()
        } else {
          window.open(`/api/invoices/${savedId}/pdf`, '_blank')
        }
        setPendingPDF(null)
        toast.success(`${savedNum} saved`)
        navigate('/invoices')
      } else {
        toast.success(isEdit ? 'Invoice updated' : `${res.data.invoiceNumber} created`)
        navigate('/invoices')
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Something went wrong'),
  })

  const buildPayload = (submitStatus) => ({
    ...form,
    clientId: Number(form.clientId),
    status: submitStatus,
    lineItems: lineItems.map((li, i) => ({
      description: li.detail ? `${li.service} — ${li.detail}` : li.service,
      quantity: li.quantity,
      unitPriceCents: li.unitPriceCents,
      sortOrder: i,
    })),
  })

  const handleSubmit = (submitStatus) => {
    if (!form.clientId) return toast.error('Please select a client')
    if (!form.dueDate) return toast.error('Please set a due date')
    if (lineItems.some((li) => !li.service)) return toast.error('All line items need a description')
    mutation.mutate(buildPayload(submitStatus))
  }

  const handlePDF = (mode) => {
    if (!form.clientId) return toast.error('Please select a client')
    if (!form.dueDate) return toast.error('Please set a due date')
    if (lineItems.some((li) => !li.service)) return toast.error('All line items need a description')
    if (isEdit) {
      if (mode === 'download') {
        const a = document.createElement('a')
        a.href = apiUrl(`/invoices/${id}/pdf`)
        a.download = `${invoiceNumber}.pdf`
        a.click()
      } else {
        window.open(`/api/invoices/${id}/pdf`, '_blank')
      }
    } else {
      setPendingPDF(mode)
      mutation.mutate(buildPayload('draft'))
    }
  }

  const handleCreateAndSend = () => {
    if (!form.clientId) return toast.error('Please select a client')
    if (!form.dueDate) return toast.error('Please set a due date')
    if (lineItems.some((li) => !li.service)) return toast.error('All line items need a description')
    const client = clients.find((c) => c.id === Number(form.clientId))
    const subject = encodeURIComponent(`Invoice ${invoiceNumber}`)
    const body = encodeURIComponent(`Hi ${client?.contactName || ''},\n\nPlease find attached invoice ${invoiceNumber}.\n\nThank you for your business.`)
    const mailto = `mailto:${client?.email || ''}?subject=${subject}&body=${body}`
    if (isEdit) {
      window.location.href = mailto
    } else {
      setPendingMailto(mailto)
      mutation.mutate(buildPayload('sent'))
    }
  }

  const inputClass = 'w-full border border-slate-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white'

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-1 text-sm mb-3 hover:underline"
            style={{ color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Invoices
          </button>
          <h2
            className="text-4xl font-extrabold tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}
          >
            {isEdit ? 'Edit Invoice' : 'New Invoice'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-2xl font-extrabold"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-secondary)' }}
          >
            {invoiceNumber}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main form — left 8 cols */}
        <div className="col-span-1 lg:col-span-8 space-y-6">

          {/* Client + Dates */}
          <div className="bg-white rounded-xl p-8 whisper-shadow">
            <h3
              className="text-sm font-bold uppercase tracking-widest mb-6"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-secondary)' }}
            >
              Invoice Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Client *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewClientModal(true)}
                    className="flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: '#0F172A', fontFamily: 'Manrope, sans-serif' }}
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    New client
                  </button>
                </div>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.businessName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Issue Date *
                </label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, issueDate: e.target.value }))
                    updateDueDate(e.target.value, form.paymentTerms)
                  }}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Payment Terms
                </label>
                <select
                  value={form.paymentTerms}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, paymentTerms: e.target.value }))
                    updateDueDate(form.issueDate, e.target.value)
                  }}
                  className={inputClass}
                >
                  {PAYMENT_TERMS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Due Date *
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Tax Rate
                </label>
                <select
                  value={taxRates.findIndex((t) => t.taxLabel === form.taxLabel && t.value === form.taxRate)}
                  onChange={(e) => handleTaxPreset(e.target.value)}
                  className={inputClass}
                >
                  {taxRates.map((t, i) => (
                    <option key={i} value={i}>{t.label}</option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="manage">Manage rates…</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white rounded-xl p-8 whisper-shadow">
            <h3
              className="text-sm font-bold uppercase tracking-widest mb-6"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-secondary)' }}
            >
              Line Items
            </h3>
            <table className="w-full mb-4">
              <thead>
                <tr
                  className="text-[10px] font-bold uppercase tracking-widest border-b border-slate-100"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
                >
                  <th className="pb-3 text-left font-bold">Product / Service</th>
                  <th className="pb-3 text-left font-bold">Description</th>
                  <th className="pb-3 text-left font-bold w-24">Qty</th>
                  <th className="pb-3 text-left font-bold w-32">Unit Price</th>
                  <th className="pb-3 text-right font-bold w-32">Amount</th>
                  <th className="pb-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <LineItemRow
                    key={i}
                    item={item}
                    index={i}
                    onChange={updateLineItem}
                    onRemove={removeLineItem}
                    isOnly={lineItems.length === 1}
                    services={services}
                    onAddService={addService}
                  />
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-2 text-sm font-semibold hover:underline mt-2"
              style={{ color: '#0F172A', fontFamily: 'Manrope, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Line Item
            </button>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl p-8 whisper-shadow">
            <h3
              className="text-sm font-bold uppercase tracking-widest mb-4"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-secondary)' }}
            >
              Notes & Terms
            </h3>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={4}
              placeholder="Add any notes or payment instructions…"
              className="w-full border border-slate-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white resize-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>

        {/* Summary sidebar — right 4 cols */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          {/* Totals card */}
          <div
            className="rounded-xl p-8 text-white"
            style={{ backgroundColor: '#0F172A' }}
          >
            <h3
              className="text-[10px] font-bold uppercase tracking-widest mb-6"
              style={{ color: '#94a3b8', fontFamily: 'Manrope, sans-serif' }}
            >
              Invoice Summary
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#94a3b8' }}>Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#94a3b8' }}>
                  {form.taxRate === 0 ? `${form.taxLabel} (Exempt)` : `${form.taxLabel} (${form.taxRate / 100}%)`}
                </span>
                <span className="font-semibold">
                  {form.taxRate === 0 ? 'N/A' : formatCurrency(taxCents)}
                </span>
              </div>
            </div>
            <div className="border-t border-white/20 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                  Total
                </span>
                <span className="text-2xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {formatCurrency(totalCents)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions card */}
          <div className="bg-white rounded-xl p-8 whisper-shadow space-y-3">
            <h3
              className="text-[10px] font-bold uppercase tracking-widest mb-4"
              style={{ color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
            >
              Actions
            </h3>
            <Button
              className="w-full justify-center"
              onClick={() => handleSubmit('sent')}
              disabled={mutation.isPending}
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              {isEdit ? 'Save & Mark Sent' : 'Create'}
            </Button>
            <Button
              className="w-full justify-center"
              onClick={() => handleCreateAndSend()}
              disabled={mutation.isPending}
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              {isEdit ? 'Save & Send' : 'Create & Send'}
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => handlePDF('download')}
              disabled={mutation.isPending}
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Download PDF
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => handlePDF('print')}
              disabled={mutation.isPending}
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Print
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => handleSubmit('draft')}
              disabled={mutation.isPending}
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save as Draft
            </Button>
          </div>
        </div>
      </div>

      {showTaxModal && (
        <TaxRatesModal
          rates={taxRates}
          onAdd={(rate) => { addTaxRate(rate) }}
          onRemove={removeTaxRate}
          onClose={() => setShowTaxModal(false)}
        />
      )}

      {showNewClientModal && (
        <ClientFormModal
          client={null}
          onClose={(newClient) => {
            setShowNewClientModal(false)
            if (newClient?.id) setForm((f) => ({ ...f, clientId: newClient.id }))
          }}
        />
      )}
    </div>
  )
}
