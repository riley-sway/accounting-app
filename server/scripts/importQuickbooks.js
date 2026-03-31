/**
 * QuickBooks import script
 * Reads the two QB export zip files from "quickbooks data/" and imports
 * clients + invoices into the SQLite database.
 *
 * Usage: node scripts/importQuickbooks.js
 *        (run from server/ directory)
 *
 * Or call runImport() from the API route.
 */

import { PrismaClient } from '@prisma/client'
import AdmZip from 'adm-zip'
import * as XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const QB_DATA_DIR = path.join(__dirname, '../../../quickbooks data')
const OUTSTANDING_INVOICES = new Set([118, 119, 120, 121])
const TODAY = '2026-03-30'

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseQBDate(raw) {
  // Input: "19-11-2014"  →  Output: "2014-11-19"
  if (!raw || typeof raw !== 'string') return null
  const parts = raw.split('-')
  if (parts.length !== 3) return null
  const [dd, mm, yyyy] = parts
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function dollarsToCents(val) {
  if (val === null || val === undefined || val === '') return 0
  return Math.round(parseFloat(val) * 100)
}

function fmtInvNumber(ref) {
  return `INV-${String(ref).padStart(3, '0')}`
}

function parseAddress(raw) {
  if (!raw) return {}
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const result = { addressLine1: null, city: null, state: null, postcode: null, country: 'Canada' }
  if (lines.length === 0) return result

  // If last line looks like a country name (letters only, no numbers), use it
  const lastLine = lines[lines.length - 1]
  if (/^[A-Za-z\s]+$/.test(lastLine) && lines.length > 1) {
    result.country = lastLine
    lines.pop()
  }

  result.addressLine1 = lines[0] || null

  if (lines.length >= 2) {
    const cityLine = lines[1]
    // Match "Suburb STATE Postcode" e.g. "Calgary AB T2B 3J9" or "Sydney NSW 2000"
    const m = cityLine.match(/^(.+?)\s+([A-Z]{2,3})\s+([A-Z0-9]{3,8})$/)
    if (m) {
      result.city = m[1].trim()
      result.state = m[2]
      result.postcode = m[3]
    } else {
      // Could be "Calgary Alberta" or just a city
      const parts = cityLine.split(/\s+/)
      if (parts.length >= 2) {
        result.city = parts.slice(0, -1).join(' ')
        result.state = parts[parts.length - 1]
      } else {
        result.city = cityLine
      }
    }
  }

  return result
}

function findZip(pattern) {
  const files = fs.readdirSync(QB_DATA_DIR)
  const match = files.find(f => f.toLowerCase().includes(pattern.toLowerCase()) && f.endsWith('.zip'))
  if (!match) throw new Error(`No zip matching "${pattern}" in ${QB_DATA_DIR}`)
  return path.join(QB_DATA_DIR, match)
}

function readExcelFromZip(zipPath, nameContains) {
  const zip = new AdmZip(zipPath)
  const entry = zip.getEntries().find(e => e.entryName.toLowerCase().includes(nameContains.toLowerCase()))
  if (!entry) throw new Error(`No file matching "${nameContains}" in ${zipPath}`)
  return entry.getData()
}

// ─── Parse clients from Customers.xlsx ──────────────────────────────────────

function parseCustomers() {
  const buf = readExcelFromZip(findZip('lists'), 'customer')
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

  // Header at row index 4, data from row 5 onward
  const clients = []
  for (let i = 5; i < rows.length; i++) {
    const row = rows[i]
    const businessName = row[1] ? String(row[1]).trim() : null
    if (!businessName) continue

    const phone = row[2] ? String(row[2]).replace(/^Phone:\s*/i, '').trim() || null : null
    const email = row[3] ? String(row[3]).trim() || null : null
    const contactName = row[4] ? String(row[4]).trim() : businessName
    const addrRaw = row[5] ? String(row[5]).trim() : null
    const addr = parseAddress(addrRaw)

    clients.push({ businessName, contactName, email: email || '', phone, ...addr })
  }
  return clients
}

// ─── Parse invoices from General_ledger.xlsx AR section ─────────────────────

function parseInvoices() {
  const buf = readExcelFromZip(findZip('reports'), 'general_ledger')
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

  // Collect all Invoice rows from the Accounts Receivable section
  const invoiceRows = rows.filter(r =>
    r &&
    r[2] === 'Invoice' &&
    r[6] &&
    String(r[6]).includes('Accounts Receivable') &&
    r[3] !== null
  )

  return invoiceRows.map(r => ({
    ref: Number(r[3]),
    date: parseQBDate(String(r[1])),
    clientName: String(r[4] || '').trim(),
    memo: r[5] ? String(r[5]).trim() : null,
    amountDollars: parseFloat(r[7]) || 0,
  })).filter(inv => inv.ref && inv.date && inv.clientName)
}

// ─── Main import ─────────────────────────────────────────────────────────────

export async function runImport({ clearExisting = true } = {}) {
  const prisma = new PrismaClient()
  const log = []
  const out = (msg) => { console.log(msg); log.push(msg) }

  try {
    out('Reading QuickBooks export files...')
    const customerData = parseCustomers()
    const invoiceData = parseInvoices()
    out(`  Found ${customerData.length} customers, ${invoiceData.length} invoices`)

    if (clearExisting) {
      out('Clearing existing data...')
      await prisma.invoiceLineItem.deleteMany()
      await prisma.invoice.deleteMany()
      await prisma.client.deleteMany()
      await prisma.settings.upsert({
        where: { id: 1 },
        update: { nextNumber: 1 },
        create: { id: 1, nextNumber: 1 },
      })
    }

    // ── Import clients ──────────────────────────────────────────────────────
    out('Importing clients...')
    const clientMap = new Map() // businessName (lower) → Client record

    for (const c of customerData) {
      const created = await prisma.client.create({ data: c })
      clientMap.set(c.businessName.toLowerCase(), created)
    }
    out(`  Created ${customerData.length} clients`)

    // ── Ensure every invoice client exists ──────────────────────────────────
    const uniqueGLClients = [...new Set(invoiceData.map(i => i.clientName))]
    let extraClients = 0
    for (const name of uniqueGLClients) {
      if (!clientMap.has(name.toLowerCase())) {
        const created = await prisma.client.create({
          data: { businessName: name, contactName: name, email: '' },
        })
        clientMap.set(name.toLowerCase(), created)
        extraClients++
      }
    }
    if (extraClients > 0) out(`  Created ${extraClients} additional clients from invoice history`)

    // ── Import invoices ─────────────────────────────────────────────────────
    out('Importing invoices...')
    let invoiceCount = 0

    for (const inv of invoiceData) {
      const client = clientMap.get(inv.clientName.toLowerCase())
      if (!client) continue // shouldn't happen after the loop above

      const invoiceNumber = fmtInvNumber(inv.ref)
      const issueDate = inv.date
      const dueDate = addDays(issueDate, 30)
      const isOutstanding = OUTSTANDING_INVOICES.has(inv.ref)

      // Determine status
      let status
      if (!isOutstanding) {
        status = 'paid'
      } else if (dueDate < TODAY) {
        status = 'overdue'
      } else {
        status = 'sent'
      }

      const totalCents = dollarsToCents(inv.amountDollars)
      const description = inv.memo || 'Professional services'

      await prisma.invoice.create({
        data: {
          invoiceNumber,
          clientId: client.id,
          status,
          issueDate,
          dueDate,
          paymentTerms: 'NET_30',
          notes: null,
          taxRate: 0,       // no tax breakdown available from QB export
          taxLabel: null,
          subtotalCents: totalCents,
          taxCents: 0,
          totalCents,
          paidAt: status === 'paid' ? issueDate : null,
          lineItems: {
            create: [{
              description,
              quantity: 100,          // 1.00 unit × 100
              unitPriceCents: totalCents,
              lineTotalCents: totalCents,
              sortOrder: 0,
            }],
          },
        },
      })
      invoiceCount++
    }

    out(`  Created ${invoiceCount} invoices`)

    // ── Update invoice counter ──────────────────────────────────────────────
    const maxRef = Math.max(...invoiceData.map(i => i.ref))
    const nextNumber = maxRef + 1
    await prisma.settings.upsert({
      where: { id: 1 },
      update: { nextNumber },
      create: { id: 1, nextNumber },
    })
    out(`  Invoice counter set to ${nextNumber} (next will be INV-${String(nextNumber).padStart(3, '0')})`)

    out('Import complete.')
    return { success: true, log }
  } catch (err) {
    out(`ERROR: ${err.message}`)
    return { success: false, error: err.message, log }
  } finally {
    await prisma.$disconnect()
  }
}

// ── Run directly when called as a script ──────────────────────────────────
if (process.argv[1] && process.argv[1].includes('importQuickbooks')) {
  runImport().then(result => {
    process.exit(result.success ? 0 : 1)
  })
}
