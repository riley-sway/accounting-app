import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const PDFDocument = require('pdfkit')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGO_PATH = path.resolve(__dirname, '../assets/logo.png')

const DARK = '#0F172A'
const WHITE = '#FFFFFF'
const MUTED = '#45464d'
const SLATE = '#94a3b8'
const BORDER = '#e0e3e5'
const ROW_ALT = '#f7f9fb'
const GREEN_BG = '#d1fae5'
const GREEN_FG = '#065f46'
const AMBER_BG = '#fef3c7'
const AMBER_FG = '#92400e'

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 40

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

const termsMap = {
  DUE_ON_RECEIPT: 'Due on Receipt',
  NET_7: 'Net 7 Days',
  NET_14: 'Net 14 Days',
  NET_30: 'Net 30 Days',
  NET_60: 'Net 60 Days',
}

export async function generateInvoicePDF(invoice, settings) {
  const businessName = settings?.businessName || 'Sway Creative'

  const CONTENT_W = PAGE_W - MARGIN * 2

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: invoice.invoiceNumber } })
    const chunks = []
    doc.on('data', c => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // ── HEADER ────────────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 100).fill(DARK)

    // Logo
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, MARGIN, 30, { height: 40, fit: [160, 40] })
    } else {
      doc.fontSize(16).fillColor(WHITE).font('Helvetica-Bold').text(businessName, MARGIN, 40)
    }

    // Invoice number (top right)
    doc.fontSize(8).fillColor(SLATE).font('Helvetica').text('INVOICE', MARGIN, 36, { width: CONTENT_W, align: 'right', characterSpacing: 2 })
    doc.fontSize(20).fillColor(WHITE).font('Helvetica-Bold').text(invoice.invoiceNumber, MARGIN, 50, { width: CONTENT_W, align: 'right' })

    // ── META SECTION ──────────────────────────────────────────────────────────
    let y = 116

    // Bill To
    doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold').text('BILL TO', MARGIN, y, { characterSpacing: 1.5 })
    y += 16
    doc.fontSize(14).fillColor(DARK).font('Helvetica-Bold').text(invoice.client.businessName, MARGIN, y)
    y += 18
    doc.fontSize(11).fillColor(MUTED).font('Helvetica')

    const addrLines = [
      invoice.client.contactName,
      invoice.client.addressLine1,
      invoice.client.addressLine2,
      [invoice.client.city, invoice.client.state, invoice.client.postcode].filter(Boolean).join(' '),
      invoice.client.country !== 'Canada' ? invoice.client.country : null,
      invoice.client.email,
    ].filter(Boolean)

    for (const line of addrLines) {
      doc.text(line, MARGIN, y)
      y += 14
    }

    // Status badge
    if (invoice.status === 'paid') {
      doc.roundedRect(MARGIN, y + 4, 38, 16, 3).fill(GREEN_BG)
      doc.fontSize(8).fillColor(GREEN_FG).font('Helvetica-Bold').text('PAID', MARGIN + 8, y + 8)
      y += 24
    } else if (invoice.status === 'overdue') {
      doc.roundedRect(MARGIN, y + 4, 56, 16, 3).fill(AMBER_BG)
      doc.fontSize(8).fillColor(AMBER_FG).font('Helvetica-Bold').text('OVERDUE', MARGIN + 8, y + 8)
      y += 24
    }

    // Invoice Details (right column, starting at same y=116)
    const detailRows = [
      ['Issue Date', formatDate(invoice.issueDate)],
      ['Due Date', formatDate(invoice.dueDate)],
    ]
    if (invoice.paymentTerms) detailRows.push(['Terms', termsMap[invoice.paymentTerms] || invoice.paymentTerms])
    if (invoice.paidAt) detailRows.push(['Paid On', formatDate(invoice.paidAt.split('T')[0])])

    const labelW = 75
    const rightColX = PAGE_W - MARGIN - 220
    let ry = 116
    doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold').text('INVOICE DETAILS', rightColX, ry, { characterSpacing: 1.5 })
    ry += 16
    for (const [label, value] of detailRows) {
      doc.fontSize(11).fillColor(MUTED).font('Helvetica').text(label, rightColX, ry, { width: labelW })
      doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold').text(value, rightColX + labelW, ry)
      ry += 16
    }

    // Divider
    const metaBottom = Math.max(y, ry) + 12
    doc.moveTo(MARGIN, metaBottom).lineTo(PAGE_W - MARGIN, metaBottom).strokeColor(BORDER).lineWidth(1).stroke()

    // ── LINE ITEMS ────────────────────────────────────────────────────────────
    const tableY = metaBottom + 20
    const colW = [CONTENT_W * 0.5, CONTENT_W * 0.15, CONTENT_W * 0.175, CONTENT_W * 0.175]
    const colX = [MARGIN, MARGIN + colW[0], MARGIN + colW[0] + colW[1], MARGIN + colW[0] + colW[1] + colW[2]]
    const ROW_H = 32
    const PAD = 10

    // Header row
    doc.rect(MARGIN, tableY, CONTENT_W, ROW_H).fill(DARK)
    const headers = ['DESCRIPTION', 'QTY', 'UNIT PRICE', 'AMOUNT']
    const aligns = ['left', 'right', 'right', 'right']
    headers.forEach((h, i) => {
      doc.fontSize(8).fillColor(WHITE).font('Helvetica-Bold')
        .text(h, colX[i] + PAD, tableY + 11, { width: colW[i] - PAD * 2, align: aligns[i], characterSpacing: 1.2 })
    })

    let rowY = tableY + ROW_H
    invoice.lineItems.forEach((li, idx) => {
      const fill = idx % 2 === 1 ? ROW_ALT : WHITE
      doc.rect(MARGIN, rowY, CONTENT_W, ROW_H).fill(fill)
      doc.fontSize(11).fillColor(DARK).font('Helvetica')
        .text(li.description, colX[0] + PAD, rowY + 10, { width: colW[0] - PAD * 2 })
      doc.text(formatQty(li.quantity), colX[1] + PAD, rowY + 10, { width: colW[1] - PAD * 2, align: 'right' })
      doc.text(formatCurrency(li.unitPriceCents), colX[2] + PAD, rowY + 10, { width: colW[2] - PAD * 2, align: 'right' })
      doc.font('Helvetica-Bold').text(formatCurrency(li.lineTotalCents), colX[3] + PAD, rowY + 10, { width: colW[3] - PAD * 2, align: 'right' })
      rowY += ROW_H
    })

    // ── TOTALS ────────────────────────────────────────────────────────────────
    const TOTALS_W = 240
    const totalsX = PAGE_W - MARGIN - TOTALS_W
    let ty = rowY + 16

    const taxLabel = invoice.taxRate === 0
      ? `${invoice.taxLabel || 'Tax'} (Exempt)`
      : `${invoice.taxLabel || 'Tax'} (${invoice.taxRate / 100}%)`
    const taxValue = invoice.taxRate === 0 ? 'N/A' : formatCurrency(invoice.taxCents)

    // Subtotal row
    doc.rect(totalsX, ty, TOTALS_W, 32).fill(ROW_ALT)
    doc.fontSize(11).fillColor(MUTED).font('Helvetica').text('Subtotal', totalsX + 16, ty + 10, { width: 120 })
    doc.font('Helvetica-Bold').fillColor(DARK).text(formatCurrency(invoice.subtotalCents), totalsX + 16, ty + 10, { width: TOTALS_W - 32, align: 'right' })
    doc.moveTo(totalsX, ty + 32).lineTo(totalsX + TOTALS_W, ty + 32).strokeColor(BORDER).stroke()
    ty += 32

    // Tax row
    doc.rect(totalsX, ty, TOTALS_W, 32).fill(ROW_ALT)
    doc.fontSize(11).fillColor(MUTED).font('Helvetica').text(taxLabel, totalsX + 16, ty + 10, { width: 120 })
    doc.font('Helvetica-Bold').fillColor(DARK).text(taxValue, totalsX + 16, ty + 10, { width: TOTALS_W - 32, align: 'right' })
    ty += 32

    // Total row
    doc.rect(totalsX, ty, TOTALS_W, 40).fill(DARK)
    doc.fontSize(9).fillColor(SLATE).font('Helvetica-Bold').text('TOTAL DUE', totalsX + 16, ty + 12, { characterSpacing: 1 })
    doc.fontSize(16).fillColor(WHITE).font('Helvetica-Bold').text(formatCurrency(invoice.totalCents), totalsX + 16, ty + 10, { width: TOTALS_W - 32, align: 'right' })
    ty += 40

    // ── NOTES ─────────────────────────────────────────────────────────────────
    let footerY = ty + 24
    if (invoice.notes) {
      doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold').text('NOTES', MARGIN, ty + 8, { characterSpacing: 1.5 })
      doc.fontSize(11).fillColor(MUTED).font('Helvetica').text(invoice.notes, MARGIN, ty + 22, { width: CONTENT_W * 0.6 })
      footerY = ty + 44 + doc.heightOfString(invoice.notes, { width: CONTENT_W * 0.6 })
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    doc.moveTo(MARGIN, footerY).lineTo(PAGE_W - MARGIN, footerY).strokeColor(BORDER).stroke()
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
      .text(businessName, MARGIN, footerY + 10, { width: CONTENT_W * 0.6 })
      .text('Thank you for your business.', MARGIN, footerY + 10, { width: CONTENT_W, align: 'right' })

    doc.end()
  })
}
