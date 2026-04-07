import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '../lib/api'
import Button from '../components/ui/Button'
import SearchInput from '../components/ui/SearchInput'
import ClientFormModal from '../components/client/ClientFormModal'
import EmptyState from '../components/ui/EmptyState'

export default function ClientDirectory() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { search: globalSearch = '' } = useOutletContext() || {}
  const [search, setSearch] = useState('')
  const effectiveSearch = globalSearch || search
  const [modalClient, setModalClient] = useState(null) // null=closed, {}=new, client=edit
  const [showModal, setShowModal] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleQBImport = async () => {
    if (!window.confirm('This will replace ALL existing clients and invoices with data from the QuickBooks export files. Continue?')) return
    setImporting(true)
    try {
      const { data } = await api.post('/import/quickbooks')
      queryClient.invalidateQueries()
      toast.success(`Import complete — ${data.log?.[data.log.length - 1] ?? 'done'}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then((r) => r.data),
  })

  const deleteClient = useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client removed')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Cannot delete client'),
  })

  const filtered = clients.filter(
    (c) =>
      c.businessName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      c.contactName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(effectiveSearch.toLowerCase())
  )

  const handleDelete = (client) => {
    if (window.confirm(`Delete ${client.businessName}? This cannot be undone.`)) {
      deleteClient.mutate(client.id)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <span
            className="text-[10px] font-bold tracking-widest uppercase block mb-2"
            style={{ color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
          >
            Directory
          </span>
          <h2
            className="text-4xl font-extrabold tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}
          >
            Client Directory
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleQBImport} disabled={importing}>
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            {importing ? 'Importing…' : 'Import from QuickBooks'}
          </Button>
          <Button onClick={() => { setModalClient({}); setShowModal(true) }}>
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Add Client
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search clients…"
          className="max-w-sm"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="group"
          title={search ? 'No matching clients' : 'No clients yet'}
          description={search ? 'Try a different search term.' : 'Add your first client to get started.'}
          action={
            !search && (
              <Button onClick={() => { setModalClient({}); setShowModal(true) }}>
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Add Client
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-xl whisper-shadow overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr
                className="text-[10px] font-bold uppercase tracking-widest border-b border-slate-100"
                style={{ color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif', backgroundColor: 'var(--bg-subtle)' }}
              >
                <th className="px-8 py-5 font-bold">Business</th>
                <th className="px-8 py-5 font-bold">Contact</th>
                <th className="px-8 py-5 font-bold">Email</th>
                <th className="px-8 py-5 font-bold">Location</th>
                <th className="px-8 py-5 font-bold text-right">Invoices</th>
                <th className="px-8 py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
                      >
                        {client.businessName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {client.businessName}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {client.contactName}
                  </td>
                  <td className="px-8 py-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {client.email}
                  </td>
                  <td className="px-8 py-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {[client.city, client.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => navigate(`/invoices?clientId=${client.id}`)}
                      className="text-sm font-bold hover:underline"
                      style={{ fontFamily: 'Manrope, sans-serif', color: '#0F172A' }}
                    >
                      {client._count?.invoices ?? 0}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setModalClient(client); setShowModal(true) }}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(client)}
                        className="p-2 rounded-full hover:bg-red-50 transition-colors"
                        style={{ color: '#ba1a1a' }}
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ClientFormModal
          client={modalClient && Object.keys(modalClient).length > 0 ? modalClient : null}
          onClose={() => { setShowModal(false); setModalClient(null) }}
        />
      )}
    </div>
  )
}
