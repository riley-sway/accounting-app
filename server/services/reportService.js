import { createRequire } from 'module'
import { PrismaClient } from '@prisma/client'

const PDFDocument = createRequire(import.meta.url)('pdfkit')

const prisma = new PrismaClient()

const DARK = '#0F172A'
const WHITE = '#FFFFFF'
const MUTED = '#45464d'
const SLATE = '#94a3b8'
const BORDER = '#e0e3e5'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const ROW_ALT = '#f7f9fb'

const PAGE_W = 595.28
const MARGIN = 40
const CONTENT_W = PAGE_W - MARGIN * 2
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(cents) {
  return '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export async function getMonthlyReport(year) {
  const months = []
  for (let m = 1; m <= 12; m++) {
    months.push(`${year}-${String(m).padStart(2, '0')}`)
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: { startsWith: year },
      status: { not: 'draft' },
    },
    select: { issueDate: true, totalCents: true, status: true },
  })

  return months.map((month) => {
    const monthInvoices = invoices.filter((inv) => inv.issueDate.startsWith(month))
    const invoicedCents = monthInvoices.reduce((s, i) => s + i.totalCents, 0)
    const paidCents = monthInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.totalCents, 0)
    return {
      month,
      invoicedCents,
      paidCents,
      outstandingCents: invoicedCents - paidCents,
      count: monthInvoices.length,
    }
  })
}

export async function generateReportPDF(year) {
  const data = await getMonthlyReport(year)
  const settings = await prisma.settings.findUnique({ where: { id: 1 } })
  const businessName = settings?.businessName || 'Sway Creative'
  const abnText = settings?.abn ? ` — ABN ${settings.abn}` : ''

  const totalInvoiced = data.reduce((s, m) => s + m.invoicedCents, 0)
  const totalPaid = data.reduce((s, m) => s + m.paidCents, 0)
  const totalOutstanding = totalInvoiced - totalPaid

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `${businessName} — ${year} Report` } })
    const chunks = []
    doc.on('data', c => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // ── HEADER ────────────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 90).fill(DARK)
    doc.fontSize(9).fillColor(SLATE).font('Helvetica').text('ANNUAL REPORT', MARGIN, 32, { characterSpacing: 2 })
    doc.fontSize(22).fillColor(WHITE).font('Helvetica-Bold').text(businessName, MARGIN, 46)
    doc.fontSize(32).fillColor(WHITE).font('Helvetica-Bold').text(year, MARGIN, 28, { width: CONTENT_W, align: 'right' })
    doc.fontSize(10).fillColor(SLATE).font('Helvetica').text('Financial Year Summary', MARGIN, 64, { width: CONTENT_W, align: 'right' })

    // ── STAT CARDS ────────────────────────────────────────────────────────────
    const cardY = 106
    const cardH = 64
    const cardW = (CONTENT_W - 16) / 3

    // Total Invoiced
    doc.rect(MARGIN, cardY, cardW, cardH).fill(ROW_ALT)
    doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold').text('TOTAL INVOICED', MARGIN + 16, cardY + 14, { characterSpacing: 1.2 })
    doc.fontSize(20).fillColor(DARK).font('Helvetica-Bold').text(fmt(totalInvoiced), MARGIN + 16, cardY + 28)

    // Total Collected
    const card2X = MARGIN + cardW + 8
    doc.rect(card2X, cardY, cardW, cardH).fill(ROW_ALT)
    doc.rect(card2X, cardY, 4, cardH).fill(GREEN)
    doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold').text('TOTAL COLLECTED', card2X + 16, cardY + 14, { characterSpacing: 1.2 })
    doc.fontSize(20).fillColor(GREEN).font('Helvetica-Bold').text(fmt(totalPaid), card2X + 16, cardY + 28)

    // Outstanding
    const card3X = MARGIN + (cardW + 8) * 2
    doc.rect(card3X, cardY, cardW, cardH).fill(ROW_ALT)
    doc.rect(card3X, cardY, 4, cardH).fill(AMBER)
    doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold').text('OUTSTANDING', card3X + 16, cardY + 14, { characterSpacing: 1.2 })
    doc.fontSize(20).fillColor(AMBER).font('Helvetica-Bold').text(fmt(totalOutstanding), card3X + 16, cardY + 28)

    // ── BAR CHART ─────────────────────────────────────────────────────────────
    const chartY = cardY + cardH + 24
    doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text('Monthly Revenue', MARGIN, chartY)

    const maxVal = Math.max(...data.map(m => m.invoicedCents), 1)
    const chartH = 80
    const barW = Math.floor(CONTENT_W / 12) - 4
    const chartTop = chartY + 20

    data.forEach((m, i) => {
      const barH = Math.round((m.invoicedCents / maxVal) * chartH)
      const x = MARGIN + i * (CONTENT_W / 12)
      const y = chartTop + chartH - barH
      if (barH > 0) doc.rect(x, y, barW, barH).fill(GREEN)
      doc.fontSize(7).fillColor(MUTED).font('Helvetica').text(MONTH_NAMES[i], x, chartTop + chartH + 4, { width: barW, align: 'center' })
    })

    // ── TABLE ─────────────────────────────────────────────────────────────────
    const tableY = chartTop + chartH + 22
    const ROW_H = 28
    const colW = [CONTENT_W * 0.18, CONTENT_W * 0.22, CONTENT_W * 0.22, CONTENT_W * 0.22, CONTENT_W * 0.16]
    const colX = [MARGIN, MARGIN + colW[0], MARGIN + colW[0] + colW[1], MARGIN + colW[0] + colW[1] + colW[2], MARGIN + colW[0] + colW[1] + colW[2] + colW[3]]
    const PAD = 10

    // Header
    doc.rect(MARGIN, tableY, CONTENT_W, ROW_H).fill(DARK)
    const headers = [['Month', 'left'], ['Invoiced', 'right'], ['Collected', 'right'], ['Outstanding', 'right'], ['Invoices', 'right']]
    headers.forEach(([h, align], i) => {
      doc.fontSize(8).fillColor(WHITE).font('Helvetica-Bold')
        .text(h.toUpperCase(), colX[i] + PAD, tableY + 9, { width: colW[i] - PAD * 2, align, characterSpacing: 1 })
    })

    let ry = tableY + ROW_H
    data.forEach((m, i) => {
      doc.rect(MARGIN, ry, CONTENT_W, ROW_H).fill(i % 2 === 0 ? ROW_ALT : WHITE)
      doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold').text(MONTH_NAMES[i], colX[0] + PAD, ry + 8, { width: colW[0] - PAD * 2 })
      doc.font('Helvetica').text(fmt(m.invoicedCents), colX[1] + PAD, ry + 8, { width: colW[1] - PAD * 2, align: 'right' })
      doc.fillColor(GREEN).text(fmt(m.paidCents), colX[2] + PAD, ry + 8, { width: colW[2] - PAD * 2, align: 'right' })
      doc.fillColor(AMBER).text(fmt(m.outstandingCents), colX[3] + PAD, ry + 8, { width: colW[3] - PAD * 2, align: 'right' })
      doc.fillColor(DARK).text(String(m.count), colX[4] + PAD, ry + 8, { width: colW[4] - PAD * 2, align: 'right' })
      ry += ROW_H
    })

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const footerY = ry + 16
    doc.moveTo(MARGIN, footerY).lineTo(PAGE_W - MARGIN, footerY).strokeColor(BORDER).lineWidth(1).stroke()
    const generated = new Date().toLocaleDateString('en-CA', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
      .text(`${businessName}${abnText}`, MARGIN, footerY + 10, { width: CONTENT_W * 0.6 })
      .text(`Generated ${generated}`, MARGIN, footerY + 10, { width: CONTENT_W, align: 'right' })

    doc.end()
  })
}
