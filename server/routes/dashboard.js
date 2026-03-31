import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// GET /api/dashboard/summary
router.get('/summary', async (req, res, next) => {
  try {
    const year = new Date().getFullYear().toString()

    // YTD: all invoices issued this year (excluding draft)
    const ytdInvoices = await prisma.invoice.findMany({
      where: {
        issueDate: { startsWith: year },
        status: { not: 'draft' },
      },
      select: { totalCents: true, status: true },
    })

    const grossYTD = ytdInvoices.reduce((s, i) => s + i.totalCents, 0)
    const paidYTD = ytdInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalCents, 0)

    const outstanding = await prisma.invoice.aggregate({
      where: { status: { in: ['sent', 'overdue'] } },
      _sum: { totalCents: true },
    })

    const statusCounts = await prisma.invoice.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalCents: true },
    })

    const counts = {}
    statusCounts.forEach((s) => {
      counts[s.status] = { count: s._count.id, totalCents: s._sum.totalCents || 0 }
    })

    res.json({
      grossYTD,
      paidYTD,
      outstandingCents: outstanding._sum.totalCents || 0,
      statusCounts: counts,
    })
  } catch (e) {
    next(e)
  }
})

// GET /api/dashboard/monthly-chart
router.get('/monthly-chart', async (req, res, next) => {
  try {
    // Last 12 months
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      months.push(d.toISOString().slice(0, 7)) // YYYY-MM
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        status: { not: 'draft' },
        issueDate: { gte: months[0] + '-01' },
      },
      select: { issueDate: true, totalCents: true },
    })

    const result = months.map((month) => {
      const monthInvoices = invoices.filter((inv) => inv.issueDate.startsWith(month))
      return {
        month,
        totalCents: monthInvoices.reduce((s, i) => s + i.totalCents, 0),
      }
    })

    res.json(result)
  } catch (e) {
    next(e)
  }
})

// GET /api/dashboard/recent-activity
router.get('/recent-activity', async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: { client: { select: { businessName: true } } },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalCents: true,
        issueDate: true,
        updatedAt: true,
        client: true,
      },
    })
    res.json(invoices)
  } catch (e) {
    next(e)
  }
})

export default router
