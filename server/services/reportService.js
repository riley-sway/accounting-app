import { PrismaClient } from '@prisma/client'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

  const totalInvoiced = data.reduce((s, m) => s + m.invoicedCents, 0)
  const totalPaid = data.reduce((s, m) => s + m.paidCents, 0)
  const totalOutstanding = totalInvoiced - totalPaid

  const fmt = (cents) =>
    '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const maxVal = Math.max(...data.map((m) => m.invoicedCents), 1)
  const barWidth = 30
  const barGap = 8
  const chartHeight = 120
  const chartWidth = (barWidth + barGap) * 12

  const bars = data
    .map((m, i) => {
      const h = Math.round((m.invoicedCents / maxVal) * chartHeight)
      const x = i * (barWidth + barGap)
      const y = chartHeight - h
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="#10B981" rx="2"/>`
    })
    .join('')

  const labels = monthNames
    .map((name, i) => {
      const x = i * (barWidth + barGap) + barWidth / 2
      return `<text x="${x}" y="${chartHeight + 16}" text-anchor="middle" font-size="9" fill="#45464d">${name}</text>`
    })
    .join('')

  const rows = data
    .map((m, i) => {
      const bg = i % 2 === 0 ? '#f7f9fb' : '#ffffff'
      return `
      <tr style="background:${bg}">
        <td style="padding:10px 16px;font-weight:600">${monthNames[i]}</td>
        <td style="padding:10px 16px;text-align:right">${fmt(m.invoicedCents)}</td>
        <td style="padding:10px 16px;text-align:right;color:#10B981">${fmt(m.paidCents)}</td>
        <td style="padding:10px 16px;text-align:right;color:#F59E0B">${fmt(m.outstandingCents)}</td>
        <td style="padding:10px 16px;text-align:right">${m.count}</td>
      </tr>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; font-size: 13px; color: #191c1e; background: #fff; }
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600&display=swap');
  </style>
</head>
<body>
  <div style="background:#0F172A;color:#fff;padding:40px 48px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-family:'Manrope',sans-serif;font-size:11px;letter-spacing:0.15em;color:#94a3b8;text-transform:uppercase;margin-bottom:6px">Annual Report</div>
      <div style="font-family:'Manrope',sans-serif;font-size:28px;font-weight:800">${settings.businessName}</div>
    </div>
    <div style="text-align:right">
      <div style="font-family:'Manrope',sans-serif;font-size:36px;font-weight:800">${year}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:4px">Financial Year Summary</div>
    </div>
  </div>

  <div style="padding:40px 48px">
    <div style="display:flex;gap:24px;margin-bottom:40px">
      <div style="flex:1;background:#f7f9fb;border-radius:8px;padding:24px">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#45464d;text-transform:uppercase;margin-bottom:8px">Total Invoiced</div>
        <div style="font-family:'Manrope',sans-serif;font-size:24px;font-weight:800">${fmt(totalInvoiced)}</div>
      </div>
      <div style="flex:1;background:#f7f9fb;border-radius:8px;padding:24px;border-left:4px solid #10B981">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#45464d;text-transform:uppercase;margin-bottom:8px">Total Collected</div>
        <div style="font-family:'Manrope',sans-serif;font-size:24px;font-weight:800;color:#10B981">${fmt(totalPaid)}</div>
      </div>
      <div style="flex:1;background:#f7f9fb;border-radius:8px;padding:24px;border-left:4px solid #F59E0B">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#45464d;text-transform:uppercase;margin-bottom:8px">Outstanding</div>
        <div style="font-family:'Manrope',sans-serif;font-size:24px;font-weight:800;color:#F59E0B">${fmt(totalOutstanding)}</div>
      </div>
    </div>

    <div style="margin-bottom:40px">
      <div style="font-family:'Manrope',sans-serif;font-size:14px;font-weight:700;margin-bottom:20px">Monthly Revenue</div>
      <svg width="${chartWidth}" height="${chartHeight + 24}" viewBox="0 0 ${chartWidth} ${chartHeight + 24}">
        ${bars}
        ${labels}
      </svg>
    </div>

    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#0F172A;color:#fff">
          <th style="padding:12px 16px;text-align:left;font-size:10px;letter-spacing:0.15em;text-transform:uppercase">Month</th>
          <th style="padding:12px 16px;text-align:right;font-size:10px;letter-spacing:0.15em;text-transform:uppercase">Invoiced</th>
          <th style="padding:12px 16px;text-align:right;font-size:10px;letter-spacing:0.15em;text-transform:uppercase">Collected</th>
          <th style="padding:12px 16px;text-align:right;font-size:10px;letter-spacing:0.15em;text-transform:uppercase">Outstanding</th>
          <th style="padding:12px 16px;text-align:right;font-size:10px;letter-spacing:0.15em;text-transform:uppercase">Invoices</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div style="padding:24px 48px;border-top:1px solid #e0e3e5;display:flex;justify-content:space-between;color:#45464d;font-size:11px">
    <span>${settings.businessName}${settings.abn ? ` — ABN ${settings.abn}` : ''}</span>
    <span>Generated ${new Date().toLocaleDateString('en-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
  </div>
</body>
</html>`

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    return pdfBuffer
  } finally {
    await browser.close()
  }
}
