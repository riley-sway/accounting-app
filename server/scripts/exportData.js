import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'

const prisma = new PrismaClient()

const clients = await prisma.client.findMany()
const invoices = await prisma.invoice.findMany({ include: { lineItems: true } })
const settings = await prisma.settings.findFirst()

const data = { clients, invoices, settings }
writeFileSync('./scripts/data-export.json', JSON.stringify(data, null, 2))
console.log(`Exported ${clients.length} clients, ${invoices.length} invoices`)
await prisma.$disconnect()
