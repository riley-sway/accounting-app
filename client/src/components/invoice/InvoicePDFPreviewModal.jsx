import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function InvoicePDFPreviewModal({ invoice, onClose }) {
  const pdfUrl = `/api/invoices/${invoice.id}/pdf`

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = `${invoice.invoiceNumber}.pdf`
    a.click()
  }

  return (
    <Modal title={`Preview — ${invoice.invoiceNumber}`} onClose={onClose} wide>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleDownload} size="sm">
          <span className="material-symbols-outlined text-[16px]">download</span>
          Download PDF
        </Button>
      </div>
      <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height: '70vh' }}>
        <iframe
          src={pdfUrl}
          title={`Invoice ${invoice.invoiceNumber}`}
          className="w-full h-full"
          style={{ border: 'none' }}
        />
      </div>
    </Modal>
  )
}
