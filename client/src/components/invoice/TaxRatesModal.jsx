import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function TaxRatesModal({ rates, onAdd, onRemove, onClose }) {
  const [label, setLabel] = useState('')
  const [percent, setPercent] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    const p = parseFloat(percent)
    if (!label.trim()) return setError('Tax label is required')
    if (isNaN(p) || p < 0) return setError('Enter a valid percentage')
    setError('')
    onAdd({ taxLabel: label.trim(), percent: p })
    setLabel('')
    setPercent('')
  }

  const inputClass = 'w-full border border-slate-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white'
  const labelClass = 'block text-xs font-bold uppercase tracking-wider mb-1.5'

  return (
    <Modal title="Manage Tax Rates" onClose={onClose}>
      <div className="space-y-5">
        {/* Existing rates */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
            Current Rates
          </p>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
            {rates.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 bg-white">
                <div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.label}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>{r.taxLabel}</span>
                </div>
                {!r.isDefault && (
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="p-1 rounded hover:bg-red-50 transition-colors"
                    style={{ color: '#ba1a1a' }}
                    title="Remove"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add new rate */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
            Add Custom Rate
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Tax Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. PST"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Rate (%)</label>
              <input
                type="number"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                placeholder="e.g. 7"
                min="0"
                step="0.1"
                className={inputClass}
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
          <Button onClick={handleAdd}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Rate
          </Button>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  )
}
