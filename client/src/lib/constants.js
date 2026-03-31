export const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-amber-50 text-amber-700',
}

export const STATUS_DOT = {
  draft: 'bg-slate-400',
  sent: 'bg-blue-500',
  paid: 'bg-emerald-500',
  overdue: 'bg-amber-500',
}

export const PAYMENT_TERMS = [
  { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt' },
  { value: 'NET_7', label: 'Net 7 Days' },
  { value: 'NET_14', label: 'Net 14 Days' },
  { value: 'NET_30', label: 'Net 30 Days' },
  { value: 'NET_60', label: 'Net 60 Days' },
]

export const TAX_PRESETS = [
  { value: 0, label: 'Z (0%)', taxLabel: 'Zero-rated' },
  { value: 0, label: 'E (0%)', taxLabel: 'Exempt' },
  { value: 500, label: 'G (5%)', taxLabel: 'GST' },
]

export const STATUS_ORDER = ['overdue', 'sent', 'paid', 'draft']
