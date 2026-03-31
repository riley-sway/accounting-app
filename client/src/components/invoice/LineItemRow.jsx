import { useState, useRef, useEffect } from 'react'
import { formatCurrency } from '../../lib/formatters'

function DescriptionCell({ value, onChange, services, onAddService }) {
  const [open, setOpen] = useState(false)
  const [newService, setNewService] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleAdd = () => {
    if (onAddService(newService)) setNewService('')
  }

  const handleSelect = (service) => {
    onChange(service)
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Select a service or product"
          className="w-full border border-slate-200 rounded-l px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="border border-l-0 border-slate-200 rounded-r px-2 hover:bg-slate-50 transition-colors flex items-center"
          style={{ color: 'var(--text-secondary)' }}
          title="Choose service"
        >
          <span className="material-symbols-outlined text-[18px]">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 overflow-hidden">
          {services.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)' }}
            >
              {s}
            </button>
          ))}
          <div className="border-t border-slate-100 p-2 flex gap-2">
            <input
              type="text"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
              placeholder="Add new service…"
              className="flex-1 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <button
              type="button"
              onClick={handleAdd}
              className="text-xs font-bold px-3 py-1.5 rounded transition-colors"
              style={{ backgroundColor: '#0F172A', color: '#fff', fontFamily: 'Manrope, sans-serif' }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LineItemRow({ item, index, onChange, onRemove, isOnly, services, onAddService }) {
  const lineTotal = Math.round((item.quantity / 100) * item.unitPriceCents)

  const handleQty = (e) => {
    const val = parseFloat(e.target.value) || 0
    onChange(index, { ...item, quantity: Math.round(val * 100) })
  }

  const handlePrice = (e) => {
    const val = parseFloat(e.target.value) || 0
    onChange(index, { ...item, unitPriceCents: Math.round(val * 100) })
  }

  return (
    <tr className="group">
      <td className="py-3 pr-3">
        <DescriptionCell
          value={item.service}
          onChange={(val) => onChange(index, { ...item, service: val })}
          services={services}
          onAddService={onAddService}
        />
      </td>
      <td className="py-3 pr-3">
        <input
          type="text"
          value={item.detail}
          onChange={(e) => onChange(index, { ...item, detail: e.target.value })}
          placeholder="Specific details…"
          className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      </td>
      <td className="py-3 pr-3 w-24">
        <input
          type="number"
          value={item.quantity / 100 || ''}
          onChange={handleQty}
          placeholder="1"
          min="0"
          step="0.01"
          className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white"
        />
      </td>
      <td className="py-3 pr-3 w-32">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>$</span>
          <input
            type="number"
            value={item.unitPriceCents / 100 || ''}
            onChange={handlePrice}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full border border-slate-200 rounded pl-6 pr-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white"
          />
        </div>
      </td>
      <td className="py-3 pr-3 w-32 text-right">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(lineTotal)}
        </span>
      </td>
      <td className="py-3 w-10 text-center">
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={isOnly}
          className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-30"
          style={{ color: '#ba1a1a' }}
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </td>
    </tr>
  )
}
