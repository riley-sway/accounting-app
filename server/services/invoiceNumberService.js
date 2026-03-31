export async function generateInvoiceNumber(prisma) {
  return await prisma.$transaction(async (tx) => {
    const settings = await tx.settings.update({
      where: { id: 1 },
      data: { nextNumber: { increment: 1 } },
    })
    const num = settings.nextNumber - 1
    return `${settings.invoicePrefix}-${String(num).padStart(3, '0')}`
  })
}

export async function peekNextInvoiceNumber(prisma) {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } })
  return `${settings.invoicePrefix}-${String(settings.nextNumber).padStart(3, '0')}`
}
