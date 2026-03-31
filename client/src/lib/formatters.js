export function formatCurrency(cents) {
  const n = (cents || 0) / 100
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso + 'T12:00:00'))
}

export function formatStatus(status) {
  return { draft: 'Draft', sent: 'Pending', paid: 'Paid', overdue: 'Overdue' }[status] ?? status
}

export function formatQty(intQty) {
  const n = intQty / 100
  return n % 1 === 0 ? String(n) : n.toFixed(2)
}
