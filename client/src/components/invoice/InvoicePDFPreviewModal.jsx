import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { apiUrl } from '../../lib/api'

export default function InvoicePDFPreviewModal({ invoice, onClose }) {
  const pdfUrl = apiUrl(`/invoices/${invoice.id}/pdf`)

  const handleDownload = () => {
    window.open(pdfUrl, '_blank')
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
