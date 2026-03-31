import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import api from '../../lib/api'

const emptyForm = {
  businessName: '',
  contactName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postcode: '',
  country: 'Canada',
}

export default function ClientFormModal({ client, onClose }) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(client)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (client) {
      setForm({
        businessName: client.businessName || '',
        contactName: client.contactName || '',
        email: client.email || '',
        phone: client.phone || '',
        addressLine1: client.addressLine1 || '',
        addressLine2: client.addressLine2 || '',
        city: client.city || '',
        state: client.state || '',
        postcode: client.postcode || '',
        country: client.country || 'Canada',
      })
    }
  }, [client])

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? api.put(`/clients/${client.id}`, data)
        : api.post('/clients', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success(isEdit ? 'Client updated' : 'Client added')
      onClose(res.data)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Something went wrong'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.businessName || !form.contactName || !form.email) {
      return toast.error('Business name, contact name and email are required')
    }
    mutation.mutate(form)
  }

  const inputClass = 'w-full border border-slate-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white'
  const labelClass = 'block text-xs font-bold uppercase tracking-wider mb-1.5'

  return (
    <Modal title={isEdit ? 'Edit Client' : 'Add Client'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Business Name *</label>
          <input
            type="text"
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            className={inputClass}
            placeholder="Acme Corporation"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Contact Name *</label>
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              className={inputClass}
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
              placeholder="jane@acme.com"
            />
          </div>
        </div>
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={inputClass}
            placeholder="+1 403 000 0000"
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Address Line 1</label>
          <input
            type="text"
            value={form.addressLine1}
            onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
            className={inputClass}
            placeholder="123 Main Street"
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Address Line 2</label>
          <input
            type="text"
            value={form.addressLine2}
            onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
            className={inputClass}
            placeholder="Suite 400"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className={inputClass}
              placeholder="Calgary"
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>State</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              className={inputClass}
              placeholder="AB"
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Postcode</label>
            <input
              type="text"
              value={form.postcode}
              onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
              className={inputClass}
              placeholder="T2P 1J9"
            />
          </div>
        </div>
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Country</label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Add Client'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
