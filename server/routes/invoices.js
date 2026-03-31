import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { generateInvoiceNumber, peekNextInvoiceNumber } from '../services/invoiceNumberService.js'
import { generateInvoicePDF } from '../services/pdfService.js'

const prisma = new PrismaClient()
const router = Router()

function recalcTotals(lineItems, taxRate) {
  const subtotalCents = lineItems.reduce((sum, li) => {
    const lineTotal = Math.round((li.quantity / 100) * li.unitPriceCents)
    return sum + lineTotal
  }, 0)
  const taxCents = Math.round((subtotalCents * taxRate) / 10000)
  const totalCents = subtotalCents + taxCents
  return { subtotalCents, taxCents, totalCents }
}

// GET /api/invoices/next-number — must be before /:id
router.get('/next-number', async (req, res, next) => {
  try {
    const number = await peekNextInvoiceNumber(prisma)
    res.json({ invoiceNumber: number })
  } catch (e) {
    next(e)
  }
})

// GET /api/invoices
router.get('/', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    // Auto-flip sent invoices that are past due to overdue
    await prisma.invoice.updateMany({
      where: { status: 'sent', dueDate: { lt: today } },
      data: { status: 'overdue' },
    })

    const where = {}
    if (req.query.status) where.status = req.query.status
    if (req.query.clientId) where.clientId = Number(req.query.clientId)
    if (req.query.search) {
      where.OR = [
        { invoiceNumber: { contains: req.query.search } },
        { client: { businessName: { contains: req.query.search } } },
      ]
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { client: { select: { id: true, businessName: true, contactName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(invoices)
  } catch (e) {
    next(e)
  }
})

// GET /api/invoices/:id/pdf — before /:id to avoid conflict
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    const settings = await prisma.settings.findUnique({ where: { id: 1 } })
    const pdfBuffer = await generateInvoicePDF(invoice, settings)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`)
    res.send(pdfBuffer)
  } catch (e) {
    next(e)
  }
})

// GET /api/invoices/:id
router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    res.json(invoice)
  } catch (e) {
    next(e)
  }
})

// POST /api/invoices
router.post('/', async (req, res, next) => {
  try {
    const { clientId, lineItems = [], taxRate = 0, taxLabel, dueDate, issueDate, paymentTerms, notes, status = 'draft' } = req.body
    if (!clientId || !dueDate || !issueDate) {
      return res.status(400).json({ error: 'clientId, issueDate and dueDate are required' })
    }
    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required' })
    }

    const invoiceNumber = await generateInvoiceNumber(prisma)
    const itemsWithTotals = lineItems.map((li, i) => ({
      description: li.description,
      quantity: li.quantity,
      unitPriceCents: li.unitPriceCents,
      lineTotalCents: Math.round((li.quantity / 100) * li.unitPriceCents),
      sortOrder: i,
    }))
    const { subtotalCents, taxCents, totalCents } = recalcTotals(itemsWithTotals, taxRate)

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: Number(clientId),
        status,
        issueDate,
        dueDate,
        paymentTerms,
        notes,
        taxRate,
        taxLabel,
        subtotalCents,
        taxCents,
        totalCents,
        lineItems: { create: itemsWithTotals },
      },
      include: { client: true, lineItems: { orderBy: { sortOrder: 'asc' } } },
    })
    res.status(201).json(invoice)
  } catch (e) {
    next(e)
  }
})

// PUT /api/invoices/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { clientId, lineItems = [], taxRate = 0, taxLabel, dueDate, issueDate, paymentTerms, notes, status } = req.body
    const itemsWithTotals = lineItems.map((li, i) => ({
      description: li.description,
      quantity: li.quantity,
      unitPriceCents: li.unitPriceCents,
      lineTotalCents: Math.round((li.quantity / 100) * li.unitPriceCents),
      sortOrder: i,
    }))
    const { subtotalCents, taxCents, totalCents } = recalcTotals(itemsWithTotals, taxRate)

    // Replace line items: delete all then re-create
    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: Number(req.params.id) } })

    const invoice = await prisma.invoice.update({
      where: { id: Number(req.params.id) },
      data: {
        clientId: clientId ? Number(clientId) : undefined,
        status,
        issueDate,
        dueDate,
        paymentTerms,
        notes,
        taxRate,
        taxLabel,
        subtotalCents,
        taxCents,
        totalCents,
        lineItems: { create: itemsWithTotals },
      },
      include: { client: true, lineItems: { orderBy: { sortOrder: 'asc' } } },
    })
    res.json(invoice)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Invoice not found' })
    next(e)
  }
})

// PATCH /api/invoices/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const validStatuses = ['draft', 'sent', 'paid', 'overdue']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` })
    }
    const data = { status }
    if (status === 'paid') data.paidAt = new Date().toISOString()
    if (status !== 'paid') data.paidAt = null
    const invoice = await prisma.invoice.update({ where: { id: Number(req.params.id) }, data })
    res.json(invoice)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Invoice not found' })
    next(e)
  }
})

// DELETE /api/invoices/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: Number(req.params.id) } })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    if (invoice.status !== 'draft') {
      return res.status(409).json({ error: 'Only draft invoices can be deleted' })
    }
    await prisma.invoice.delete({ where: { id: Number(req.params.id) } })
    res.status(204).end()
  } catch (e) {
    next(e)
  }
})

export default router
