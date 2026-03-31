import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// GET /api/clients
router.get('/', async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { businessName: 'asc' },
      include: { _count: { select: { invoices: true } } },
    })
    res.json(clients)
  } catch (e) {
    next(e)
  }
})

// GET /api/clients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        _count: { select: { invoices: true } },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, invoiceNumber: true, status: true, totalCents: true, issueDate: true },
        },
      },
    })
    if (!client) return res.status(404).json({ error: 'Client not found' })
    res.json(client)
  } catch (e) {
    next(e)
  }
})

// POST /api/clients
router.post('/', async (req, res, next) => {
  try {
    const { businessName, contactName, email, phone, addressLine1, addressLine2, city, state, postcode, country } = req.body
    if (!businessName || !contactName || !email) {
      return res.status(400).json({ error: 'businessName, contactName and email are required' })
    }
    const client = await prisma.client.create({
      data: { businessName, contactName, email, phone, addressLine1, addressLine2, city, state, postcode, country: country || 'Canada' },
    })
    res.status(201).json(client)
  } catch (e) {
    next(e)
  }
})

// PUT /api/clients/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { businessName, contactName, email, phone, addressLine1, addressLine2, city, state, postcode, country } = req.body
    const client = await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: { businessName, contactName, email, phone, addressLine1, addressLine2, city, state, postcode, country },
    })
    res.json(client)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Client not found' })
    next(e)
  }
})

// DELETE /api/clients/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const count = await prisma.invoice.count({ where: { clientId: Number(req.params.id) } })
    if (count > 0) {
      return res.status(409).json({ error: `Cannot delete client with ${count} invoice${count === 1 ? '' : 's'}. Remove the invoices first.` })
    }
    await prisma.client.delete({ where: { id: Number(req.params.id) } })
    res.status(204).end()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Client not found' })
    next(e)
  }
})

export default router
