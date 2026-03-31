import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// GET /api/settings
router.get('/', async (req, res, next) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } })
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: 1 } })
    }
    res.json(settings)
  } catch (e) {
    next(e)
  }
})

// PUT /api/settings
router.put('/', async (req, res, next) => {
  try {
    const { businessName, abn, invoicePrefix, defaultTaxRate, defaultTerms } = req.body
    const settings = await prisma.settings.update({
      where: { id: 1 },
      data: { businessName, abn, invoicePrefix, defaultTaxRate, defaultTerms },
    })
    res.json(settings)
  } catch (e) {
    next(e)
  }
})

export default router
