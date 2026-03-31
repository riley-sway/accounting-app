import { Router } from 'express'
import { runImport } from '../scripts/importQuickbooks.js'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.post('/quickbooks', async (req, res, next) => {
  try {
    const result = await runImport({ clearExisting: true })
    res.status(result.success ? 200 : 500).json(result)
  } catch (err) {
    next(err)
  }
})

// Temporary one-time data migration endpoint — remove after use
router.post('/migrate', async (req, res, next) => {
  try {
    const secret = req.headers['x-migrate-secret']
    if (!secret || secret !== process.env.MIGRATE_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { clients, invoices, settings } = req.body

    if (settings) {
      await prisma.settings.upsert({ where: { id: 1 }, update: settings, create: settings })
    }

    for (const { invoices: _, ...client } of clients) {
      await prisma.client.upsert({ where: { id: client.id }, update: client, create: client })
    }

    for (const { lineItems, ...invoice } of invoices) {
      await prisma.invoice.upsert({
        where: { id: invoice.id },
        update: { ...invoice, lineItems: { deleteMany: {}, create: lineItems.map(({ id, invoiceId, ...li }) => li) } },
        create: { ...invoice, lineItems: { create: lineItems.map(({ id, invoiceId, ...li }) => li) } },
      })
    }

    res.json({ ok: true, clients: clients.length, invoices: invoices.length })
  } catch (err) {
    next(err)
  }
})

export default router
