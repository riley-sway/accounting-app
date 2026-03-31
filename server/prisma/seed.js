import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Settings singleton
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: 'Sway Creative',
      abn: '12 345 678 901',
      invoicePrefix: 'INV',
      nextNumber: 7,
      defaultTaxRate: 1000,
      defaultTerms: 'NET_30',
    },
  })

  // Clients
  const client1 = await prisma.client.upsert({
    where: { id: 1 },
    update: {},
    create: {
      businessName: 'Metropolis Urban Design',
      contactName: 'James Harlow',
      email: 'james@metropolisud.com',
      phone: '+61 2 9000 1234',
      addressLine1: '45 Pitt Street',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia',
    },
  })

  const client2 = await prisma.client.upsert({
    where: { id: 2 },
    update: {},
    create: {
      businessName: 'Aria Brand Systems',
      contactName: 'Sarah Chen',
      email: 'sarah@ariabrand.com.au',
      phone: '+61 3 9500 5678',
      addressLine1: 'Level 12, 101 Collins Street',
      city: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      country: 'Australia',
    },
  })

  const client3 = await prisma.client.upsert({
    where: { id: 3 },
    update: {},
    create: {
      businessName: 'Nordic Creative Ltd.',
      contactName: 'Erik Larsen',
      email: 'erik@nordiccreative.com',
      phone: '+61 7 3200 9012',
      addressLine1: '88 Creek Street',
      city: 'Brisbane',
      state: 'QLD',
      postcode: '4000',
      country: 'Australia',
    },
  })

  // Invoices
  // INV-001 — Paid (Jan)
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-001' },
    update: {},
    create: {
      invoiceNumber: 'INV-001',
      clientId: client1.id,
      status: 'paid',
      issueDate: '2026-01-10',
      dueDate: '2026-02-09',
      paymentTerms: 'NET_30',
      taxRate: 1000,
      taxLabel: 'GST',
      subtotalCents: 750000,
      taxCents: 75000,
      totalCents: 825000,
      paidAt: '2026-02-05T09:30:00.000Z',
      notes: 'Brand identity phase 1 — logo, typography, colour system.',
      lineItems: {
        create: [
          { description: 'Brand Strategy Workshop', quantity: 100, unitPriceCents: 250000, lineTotalCents: 250000, sortOrder: 0 },
          { description: 'Logo Design & Variations', quantity: 100, unitPriceCents: 350000, lineTotalCents: 350000, sortOrder: 1 },
          { description: 'Brand Guidelines Document', quantity: 100, unitPriceCents: 150000, lineTotalCents: 150000, sortOrder: 2 },
        ],
      },
    },
  })

  // INV-002 — Paid (Feb)
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-002' },
    update: {},
    create: {
      invoiceNumber: 'INV-002',
      clientId: client2.id,
      status: 'paid',
      issueDate: '2026-02-03',
      dueDate: '2026-03-05',
      paymentTerms: 'NET_30',
      taxRate: 1000,
      taxLabel: 'GST',
      subtotalCents: 480000,
      taxCents: 48000,
      totalCents: 528000,
      paidAt: '2026-02-28T14:00:00.000Z',
      notes: 'Website copywriting and content strategy.',
      lineItems: {
        create: [
          { description: 'Content Audit & Strategy', quantity: 100, unitPriceCents: 180000, lineTotalCents: 180000, sortOrder: 0 },
          { description: 'Website Copywriting (8 pages)', quantity: 800, unitPriceCents: 37500, lineTotalCents: 300000, sortOrder: 1 },
        ],
      },
    },
  })

  // INV-003 — Overdue (Feb, past due)
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-003' },
    update: {},
    create: {
      invoiceNumber: 'INV-003',
      clientId: client3.id,
      status: 'overdue',
      issueDate: '2026-02-14',
      dueDate: '2026-03-01',
      paymentTerms: 'NET_14',
      taxRate: 1000,
      taxLabel: 'GST',
      subtotalCents: 420000,
      taxCents: 42000,
      totalCents: 462000,
      lineItems: {
        create: [
          { description: 'Social Media Campaign Design', quantity: 100, unitPriceCents: 220000, lineTotalCents: 220000, sortOrder: 0 },
          { description: 'Photography Direction', quantity: 200, unitPriceCents: 100000, lineTotalCents: 200000, sortOrder: 1 },
        ],
      },
    },
  })

  // INV-004 — Sent (pending)
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-004' },
    update: {},
    create: {
      invoiceNumber: 'INV-004',
      clientId: client1.id,
      status: 'sent',
      issueDate: '2026-03-01',
      dueDate: '2026-03-31',
      paymentTerms: 'NET_30',
      taxRate: 1000,
      taxLabel: 'GST',
      subtotalCents: 1200000,
      taxCents: 120000,
      totalCents: 1320000,
      notes: 'Website redesign — UI/UX and design system.',
      lineItems: {
        create: [
          { description: 'UX Research & Wireframing', quantity: 100, unitPriceCents: 400000, lineTotalCents: 400000, sortOrder: 0 },
          { description: 'UI Design System', quantity: 100, unitPriceCents: 500000, lineTotalCents: 500000, sortOrder: 1 },
          { description: 'Prototype & Handoff', quantity: 100, unitPriceCents: 300000, lineTotalCents: 300000, sortOrder: 2 },
        ],
      },
    },
  })

  // INV-005 — Sent (pending)
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-005' },
    update: {},
    create: {
      invoiceNumber: 'INV-005',
      clientId: client2.id,
      status: 'sent',
      issueDate: '2026-03-10',
      dueDate: '2026-04-09',
      paymentTerms: 'NET_30',
      taxRate: 0,
      taxLabel: 'Exempt',
      subtotalCents: 360000,
      taxCents: 0,
      totalCents: 360000,
      notes: 'Aria is tax exempt — no GST charged.',
      lineItems: {
        create: [
          { description: 'Annual Brand Refresh', quantity: 100, unitPriceCents: 360000, lineTotalCents: 360000, sortOrder: 0 },
        ],
      },
    },
  })

  // INV-006 — Draft
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-006' },
    update: {},
    create: {
      invoiceNumber: 'INV-006',
      clientId: client3.id,
      status: 'draft',
      issueDate: '2026-03-28',
      dueDate: '2026-04-27',
      paymentTerms: 'NET_30',
      taxRate: 1000,
      taxLabel: 'GST',
      subtotalCents: 550000,
      taxCents: 55000,
      totalCents: 605000,
      lineItems: {
        create: [
          { description: 'Annual Report Design', quantity: 100, unitPriceCents: 350000, lineTotalCents: 350000, sortOrder: 0 },
          { description: 'Print-ready PDF Preparation', quantity: 100, unitPriceCents: 200000, lineTotalCents: 200000, sortOrder: 1 },
        ],
      },
    },
  })

  console.log('Seed complete: 1 settings, 3 clients, 6 invoices')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
