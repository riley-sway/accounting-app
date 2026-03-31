import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const LOGO_PATH = path.resolve(__dirname, '../../../branding/sway-logo-white-transparent.png')
const TEMPLATE_PATH = path.resolve(__dirname, '../templates/invoice.html')

function formatCurrency(cents) {
  const n = cents / 100
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso + 'T12:00:00'))
}

function formatQty(intQty) {
  const n = intQty / 100
  return n % 1 === 0 ? String(n) : n.toFixed(2)
}

export async function generateInvoicePDF(invoice, settings) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')

  // Logo as base64 data URI
  let logoDataUri = ''
  if (fs.existsSync(LOGO_PATH)) {
    const logoBase64 = fs.readFileSync(LOGO_PATH).toString('base64')
    logoDataUri = `data:image/png;base64,${logoBase64}`
  }

  // Client address block
  const addr = [
    invoice.client.addressLine1,
    invoice.client.addressLine2,
    [invoice.client.city, invoice.client.state, invoice.client.postcode].filter(Boolean).join(' '),
    invoice.client.country !== 'Canada' ? invoice.client.country : null,
  ]
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('')

  // Status badge
  let statusBadge = ''
  if (invoice.status === 'paid') {
    statusBadge = '<span class="status-paid">Paid</span>'
  } else if (invoice.status === 'overdue') {
    statusBadge = '<span class="status-overdue">Overdue</span>'
  }

  // Payment terms row
  const termsMap = {
    DUE_ON_RECEIPT: 'Due on Receipt',
    NET_7: 'Net 7 Days',
    NET_14: 'Net 14 Days',
    NET_30: 'Net 30 Days',
    NET_60: 'Net 60 Days',
  }
  const termsRow = invoice.paymentTerms
    ? `<div class="meta-row" style="justify-content:flex-end">
        <span class="label">Terms</span>
        <span class="value">${termsMap[invoice.paymentTerms] || invoice.paymentTerms}</span>
       </div>`
    : ''

  // Paid date row
  const paidRow = invoice.paidAt
    ? `<div class="meta-row" style="justify-content:flex-end">
        <span class="label">Paid On</span>
        <span class="value">${formatDate(invoice.paidAt.split('T')[0])}</span>
       </div>`
    : ''

  // Line items
  const lineItemsHtml = invoice.lineItems
    .map(
      (li) => `
    <tr>
      <td>${li.description}</td>
      <td class="right">${formatQty(li.quantity)}</td>
      <td class="right">${formatCurrency(li.unitPriceCents)}</td>
      <td class="right">${formatCurrency(li.lineTotalCents)}</td>
    </tr>`
    )
    .join('')

  // Tax label
  const taxLabel =
    invoice.taxRate === 0
      ? `${invoice.taxLabel || 'Tax'} (Exempt)`
      : `${invoice.taxLabel || 'Tax'} (${invoice.taxRate / 100}%)`

  // Notes
  const notesHtml =
    invoice.notes
      ? `<div class="notes">
          <h4>Notes</h4>
          <p>${invoice.notes}</p>
         </div>`
      : ''

  // ABN text
  const abnText = settings?.abn ? ` — ABN ${settings.abn}` : ''

  const html = template
    .replace(/\{\{INVOICE_NUMBER\}\}/g, invoice.invoiceNumber)
    .replace('{{LOGO_DATA_URI}}', logoDataUri)
    .replace(/\{\{BUSINESS_NAME\}\}/g, settings?.businessName || 'Sway Creative')
    .replace('{{CLIENT_BUSINESS_NAME}}', invoice.client.businessName)
    .replace('{{CLIENT_CONTACT_NAME}}', invoice.client.contactName)
    .replace('{{CLIENT_ADDRESS_HTML}}', addr)
    .replace('{{CLIENT_EMAIL}}', invoice.client.email)
    .replace('{{STATUS_BADGE}}', statusBadge)
    .replace('{{ISSUE_DATE}}', formatDate(invoice.issueDate))
    .replace('{{DUE_DATE}}', formatDate(invoice.dueDate))
    .replace('{{PAYMENT_TERMS_ROW}}', termsRow)
    .replace('{{PAID_DATE_ROW}}', paidRow)
    .replace('{{LINE_ITEMS_HTML}}', lineItemsHtml)
    .replace('{{SUBTOTAL}}', formatCurrency(invoice.subtotalCents))
    .replace('{{TAX_LABEL}}', taxLabel)
    .replace('{{TAX_AMOUNT}}', invoice.taxRate === 0 ? 'N/A' : formatCurrency(invoice.taxCents))
    .replace('{{TOTAL}}', formatCurrency(invoice.totalCents))
    .replace('{{NOTES_HTML}}', notesHtml)
    .replace('{{ABN_TEXT}}', abnText)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return pdfBuffer
  } finally {
    await browser.close()
  }
}
