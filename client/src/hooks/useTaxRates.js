import { useState } from 'react'

const DEFAULT_RATES = [
  { value: 0,   label: 'Z (0%)',  taxLabel: 'Zero-rated', isDefault: true },
  { value: 0,   label: 'E (0%)',  taxLabel: 'Exempt',     isDefault: true },
  { value: 500, label: 'G (5%)',  taxLabel: 'GST',        isDefault: true },
]

const STORAGE_KEY = 'sway_tax_rates'

export function useTaxRates() {
  const [customRates, setCustomRates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  })

  const rates = [...DEFAULT_RATES, ...customRates]

  const addRate = ({ taxLabel, percent }) => {
    const value = Math.round(parseFloat(percent) * 100)
    const label = `${taxLabel} (${percent}%)`
    const newRate = { value, label, taxLabel, isDefault: false }
    const updated = [...customRates, newRate]
    setCustomRates(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return rates.length // index of newly added rate
  }

  const removeRate = (index) => {
    const customIndex = index - DEFAULT_RATES.length
    const updated = customRates.filter((_, i) => i !== customIndex)
    setCustomRates(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  return [rates, addRate, removeRate]
}
