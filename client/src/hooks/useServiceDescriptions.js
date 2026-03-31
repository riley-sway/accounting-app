import { useState } from 'react'

const DEFAULT_SERVICES = ['Graphic Design', 'Web Design', 'Web Services', 'Consultation']
const STORAGE_KEY = 'sway_service_descriptions'

export function useServiceDescriptions() {
  const [services, setServices] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (Array.isArray(stored) && stored.length > 0) return stored
    } catch {}
    return DEFAULT_SERVICES
  })

  const addService = (name) => {
    const trimmed = name.trim()
    if (!trimmed || services.includes(trimmed)) return false
    const updated = [...services, trimmed]
    setServices(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return true
  }

  return [services, addService]
}
