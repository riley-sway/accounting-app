import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { getMonthlyReport, generateReportPDF } from '../services/reportService.js'

const prisma = new PrismaClient()
const router = Router()

// GET /api/reports/years
router.get('/years', async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: { not: 'draft' } },
      select: { issueDate: true },
    })
    const years = [...new Set(invoices.map(i => i.issueDate.slice(0, 4)))]
      .filter(Boolean)
      .sort((a, b) => b - a) // newest first
    res.json(years)
  } catch (e) {
    next(e)
  }
})

// GET /api/reports/monthly?year=2025
router.get('/monthly', async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear().toString()
    const data = await getMonthlyReport(year)
    res.json(data)
  } catch (e) {
    next(e)
  }
})

// GET /api/reports/pdf?year=2025
router.get('/pdf', async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear().toString()
    const pdfBuffer = await generateReportPDF(year)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="report-${year}.pdf"`)
    res.send(pdfBuffer)
  } catch (e) {
    next(e)
  }
})

export default router
